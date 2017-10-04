import { h } from 'virtual-dom'
import { getPostContent } from '../babble-post'
import { postPlainify } from '../../lib/babble'


export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.state  = widget.get('state')
    
    if (Discourse.User.current()) {
      return this.composer()
    } else {
      return this.loggedOutView()
    }
  },

  composer() {
    return h('div.babble-composer-wrapper', {
      className: 'wmd-controls'
    }, [
      this.editHint(),
      this.replyHint(),
      this.textarea(),
      this.uploadButton(),
      this.emojiButton(),
      this.submitButton(),
      h('form')
    ])
  },

  editHint() {
    const post = this.widget.get('post')
    if (!post) { return }
    return h('div.babble-composer-hint.babble-edit-hint-wrapper', {
      style: (this.widget.get('hintType').type !== 'edit'?{display: 'none'}:{display:'block'})
    }, [
      h('span.babble-post-hint-type', I18n.t('babble.edit')),
      h('span.babble-post-name', ['@'+post.username]),
      h('span', [postPlainify(post)]),
      this.widget.attach('button', {
        className: 'close-edit-button',
        icon: 'window-close',
        action: 'cancel'
      })
    ])
  },

  replyHint() {
    const topic = this.widget.get('state.topic')
    const postContent = getPostContent(topic, topic.get('replyingPostNumber'))
    return h('div.babble-composer-hint.babble-reply-to-wrapper', {
      style: (this.widget.get('hintType').type !== 'reply'?{display: 'none'}:{display:'block'})
    }, [
      h('span.babble-post-hint-type', I18n.t('babble.reply')),
      h('span.babble-post-name', ['@'+postContent.username]),
      h('span', [postContent.content]),
      this.widget.attach('button', {
        className: 'close-reply-button',
        icon: 'window-close',
        action: 'closeReply'
      })
    ])
  },

  textarea() {
    return h('textarea', {
      attributes: {
        'babble-composer': 'inactive',
        placeholder: Discourse.SiteSettings.babble_placeholder || I18n.t('babble.placeholder'),
        rows:        1,
        disabled:    this.state.submitDisabled
      }
    }, this.widget.get('post.raw'))
  },

  emojiButton() {
    return this.widget.attach('button', {
      className: 'emoji-button',
      icon: 'smile-o',
      action: 'selectEmoji'
    })
  },

  uploadButton() {
    return this.widget.attach('button', {
      className: 'upload-button',
      icon: 'upload',
      action: 'showUploadModal'
    })
  },

  submitButton() {
    return this.widget.attach('button', {
      className: 'submit-button'+(this.widget.get('hintType').type==='none'?'':' raised'),
      icon: 'reply',
      action: 'submit'
    })
  },

  loggedOutView() {
    return [
      h('div.babble-logged-out-message', I18n.t('babble.logged_out')),
      this.widget.attach('header-buttons', {
        canSignUp: this.widget.attrs.canSignUp,
        showLogin: null,
        showSignUp: null,
      })
    ]
  }
})
