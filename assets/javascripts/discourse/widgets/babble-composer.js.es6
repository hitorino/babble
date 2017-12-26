import { createWidget } from 'discourse/widgets/widget'
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import { ajax } from 'discourse/lib/ajax'
import showModal from 'discourse/lib/show-modal'
import autosize from 'discourse/lib/autosize'
import {
  getUploadMarkdown,
  validateUploadedFiles,
  displayErrorForUpload
} from 'discourse/lib/utilities'
import { cacheShortUploadUrl } from 'pretty-text/image-short-url'
import Session from "discourse/models/session"
import { observes } from 'ember-addons/ember-computed-decorators'

// Do deep copy to make `createWidget` happy.
export default createWidget('babble-composer', jQuery.extend(true, {
  tagName: 'div.babble-post-composer',
  classNames: ['wmd-controls'],

  messageBus: Discourse.__container__.lookup('message-bus:main'),
  uploadProgress: 0,
  _xhr: null,
  session: Session.current(),


  buildKey(attrs) {
    return `babble-composer-${attrs.topic.id}`
  },

  defaultState(attrs) {
    return {
      submitDisabled:  attrs.submitDisabled,
      topic:           attrs.topic
    }
  },

  editingId: function() {
    return this.get('state.topic.editingPostId')
  }.property('state.topic.editingPostId'),
  editing: function() {
    return !!this.get('editingId')
  }.property('editingId'),

  replyingPN: function() {
    return this.get('state.topic.replyingPostNumber')
  }.property('state.topic.replyingPostNumber'),
  replying: function() {
    return !!this.get('replyingPN')
  }.property('replyingPN'),

  post: function() {
    return this.get('state.topic.postStream.posts').findBy('id', this.get('editingId'))
  }.property('editingId'),

  hintType: function() {
    if (this.get('editing')) {
      return {
        type:'edit',
        id: this.get('editingId')
      }
    } else if (this.get('replying')) {
      return {
        type:'reply',
        postNumber: this.get('replyingPN')
      }
    } else {
      return { type:'none' }
    }
  }.property('replyingPN', 'editingId'),

  rerender() {
    this.scheduleRerender()
  },

  postComposer() {
    return $('.babble-chat > .babble-post-composer')
  },

  composerElement() {
    return this.postComposer().find('textarea')
  },

  composerWrapper() {
    return this.postComposer().find('.wmd-controls')
  },

  selectEmoji() {
    this.appEvents.trigger("babble-emoji-picker:open")
  },

  _unbindUploadTarget() {
    $(".mobile-file-upload").off("click.uploader")
    this.messageBus.unsubscribe("/uploads/composer")
    const $uploadTarget = this.composerWrapper()
    try { $uploadTarget.fileupload("destroy") }
    catch (e) { /* wasn't initialized yet */ }
    $uploadTarget.off()
  },

  _bindUploadTarget() {
    this._unbindUploadTarget() // in case it's still bound, let's clean it up first

    const $element = this.composerWrapper()
    const csrf = this.session.get('csrfToken')

    $element.fileupload({
      url: Discourse.getURL(`/uploads.json?client_id=${this.messageBus.clientId}&authenticity_token=${encodeURIComponent(csrf)}`),
      dataType: "json",
      pasteZone: $element,
    })

    $element.on('fileuploadsubmit', (e, data) => {
      data.formData = { type: "composer" }
      const isUploading = validateUploadedFiles(data.files)
      this.uploadProgress = 0
      this.isUploading = isUploading
      return isUploading
    })

    $element.on("fileuploadprogressall", (e, data) => {
      this.uploadProgress = (parseInt(data.loaded / data.total * 100, 10))
    })

    $element.on("fileuploadfail", (e, data) => {

      const userCancelled = this._xhr && this._xhr._userCancelled
      this._xhr = null

      if (!userCancelled) {
        displayErrorForUpload(data)
      }
    })

  },

  showUploadModal() {
    const append_img = upload => {
      const val = this.composerElement().val()
      this.composerElement().val(val + getUploadMarkdown(upload))
      autosize.update(this.composerElement())
    }
    this._bindUploadTarget()
    showModal('uploadSelector').setProperties({
      imageUrl: null,
      imageLink: null,
      toolbarEvent: {
        addText: (text) => {
          append_img({url: text.match(/[^\/]+\.[^\/]{1,3}$/g)})
        }
      }
    })
    this.messageBus.subscribe("/uploads/composer", upload => {
      // replace upload placeholder
      if (upload && upload.url) {
        if (!this._xhr || !this._xhr._userCancelled) {
          append_img(upload)
          cacheShortUploadUrl(upload.short_url, upload.url)
        } else {
          alert(I18n.t('babble.upload_cancelled'))
        }
      } else {
        alert(I18n.t('babble.upload_failed'))
      }
    })
  },


  closeHint() {
    this.rerender()
    //this.composerWrapper().find('div.babble-composer-hint').css('display','none')
  },

  closeReply() {
    Babble.replyPost(this.get('state.topic'), null)
    this.closeHint()
  },

  cancel() {
    Babble.editPost(this.get('state.topic'), null)
    this.closeReply()
  },

  submit() {
    const $composer = this.composerElement()
    const text = $composer.val()
    $composer.val('')
    if (!text) { return }

    if (this.get('editing')) {
      this.update(text)
    } else {
      this.create(text)
    }

    this.closeReply()
  },

  create(text) {
    this.set('state.submitDisabled', true)
    Babble.createPost(this.get('state.topic'), text).finally(() => {
      this.set('state.submitDisabled', undefined)
      Ember.run.scheduleOnce('afterRender', () => { this.composerElement().focus() })
    })
  },

  update(text) {
    if (this.get('post').raw.trim() == text.trim()) { return }
    this.set('state.submitDisabled', true)
    Babble.updatePost(this.state.topic, this.get('post'), text).finally(() => {
      this.set('state.submitDisabled', undefined)
    })
  },

  keyDown(event) {
    if (event.keyCode == 13 && !(event.ctrlKey || event.altKey || event.shiftKey)) {
      if (this.state.submitDisabled) { return }
      event.preventDefault()
      this.submit() // submit on enter
      return false
    } else if (event.keyCode == 27) {
      event.preventDefault()
      Babble.editPost(this.state.topic, null)
      return false
    }
  },

  keyUp(event) {
    if (this.state.showError) { this.set('state.showError', false) }
    if (event.keyCode == 38 &&                               // key pressed is up key
        !this.get('editing') &&                               // post is not being edited
        !$(event.target).siblings('.autocomplete').length) { // autocomplete is not active
      let myLastPost = _.last(_.select(this.state.topic.postStream.posts, function(post) {
        return post.user_id == Discourse.User.current().id
      }))
      if (myLastPost) { Babble.editPost(this.state.topic, myLastPost) }
      return false
    }

    // only fire typing events if input has changed
    // TODO: expand this to account for backspace / delete keys too
    if (event.key && event.key.length === 1) { this.announceTyping() }
  },

  announceTyping: _.throttle(function() {
    ajax(`/babble/topics/${this.state.topic.id}/typing`, { type: 'POST' })
  }, 1000),

  html() {
    this.appEvents.off('babble-composer:rerender')
    this.appEvents.on('babble-composer:rerender', ()=>this.rerender())
    return template.render(this)
  }
}, Ember.Object.prototype))