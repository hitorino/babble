import { createWidget } from 'discourse/widgets/widget'
import Babble from "../lib/babble"
import template from "../widgets/templates/babble-composer"
import { ajax } from 'discourse/lib/ajax'
import showModal from 'discourse/lib/show-modal'
import { getUploadMarkdown,
         validateUploadedFiles,
         displayErrorForUpload } from 'discourse/lib/utilities'
import { cacheShortUploadUrl } from 'pretty-text/image-short-url'
import Session from "discourse/models/session"

export default createWidget('babble-composer', {
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
      editing:         attrs.isEditing,
      submitDisabled:  attrs.submitDisabled,
      post:            attrs.post,
      topic:           attrs.topic,
      raw:             attrs.raw
    }
  },

  postComposer() {
    if (this.state.editing) {
      return $('.babble-post-container > .babble-post-composer')
    } else {
      return $('.babble-chat > .babble-post-composer')
    }
  },

  composerElement() {
    return this.postComposer().find('textarea')
  },

  composerWrapper() {
    return this.postComposer().find('.wmd-controls')
  },

  selectEmoji() {
    this.appEvents.trigger("babble-emoji-picker:open");
  },

  _unbindUploadTarget() {
    $(".mobile-file-upload").off("click.uploader");
    this.messageBus.unsubscribe("/uploads/composer");
    const $uploadTarget = this.composerWrapper();
    try { $uploadTarget.fileupload("destroy"); }
    catch (e) { /* wasn't initialized yet */ }
    $uploadTarget.off();
  },

  _bindUploadTarget() {
    this._unbindUploadTarget(); // in case it's still bound, let's clean it up first

    const $element = this.composerWrapper();
    const csrf = this.session.get('csrfToken');

    $element.fileupload({
      url: Discourse.getURL(`/uploads.json?client_id=${this.messageBus.clientId}&authenticity_token=${encodeURIComponent(csrf)}`),
      dataType: "json",
      pasteZone: $element,
    });

    $element.on('fileuploadsubmit', (e, data) => {
      data.formData = { type: "composer" };
      const isUploading = validateUploadedFiles(data.files);
      this.uploadProgress = 0
      this.isUploading = isUploading
      return isUploading;
    });

    $element.on("fileuploadprogressall", (e, data) => {
      this.uploadProgress = (parseInt(data.loaded / data.total * 100, 10));
    });

    $element.on("fileuploadfail", (e, data) => {

      const userCancelled = this._xhr && this._xhr._userCancelled;
      this._xhr = null;

      if (!userCancelled) {
        displayErrorForUpload(data);
      }
    })

  },

  showUploadModal() {
    const append_img = upload => {
      const val = this.composerElement().val()
      this.composerElement().val(val + getUploadMarkdown(upload))
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
          alert('上传已取消！')
        }
      } else {
        alert('上传失败！')
      }
    })
  },

  cancel() {
    Babble.editPost(this.state.topic, null)
  },

  submit() {
    let $composer = this.composerElement(),
        text = $composer.val();
    $composer.val('')
    if (!text) { return; }

    if (this.state.editing) {
      this.update(text)
    } else {
      this.create(text)
    }
  },

  create(text) {
    this.state.submitDisabled = true
    Babble.createPost(this.state.topic, text).finally(() => {
      this.state.submitDisabled = undefined
      Ember.run.scheduleOnce('afterRender', () => { this.composerElement().focus() })
    })
  },

  update(text) {
    if (this.state.post.raw.trim() == text.trim()) { return }
    Babble.updatePost(this.state.topic, this.state.post, text).finally(() => {
      this.state.submitDisabled = undefined
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
    if (this.state.showError) { this.state.showError = false }
    if (event.keyCode == 38 &&                               // key pressed is up key
        !this.state.editing &&                               // post is not being edited
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

  html() { return template.render(this) }
})
