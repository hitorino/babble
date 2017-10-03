import ModalFunctionality from 'discourse/mixins/modal-functionality'
import Babble from '../lib/babble'
import computed from 'ember-addons/ember-computed-decorators'
import { userPath } from 'discourse/lib/url'
import ApplicationRoute from 'discourse/routes/application'

$(window).ready(()=>{
  ApplicationRoute.reopen({
    actions: {
      closeModal: function(){
        this._super(...arguments)
        this.appEvents.trigger('babble-dmodal:closed')
      }
    }
  })
})

export default Ember.Controller.extend(ModalFunctionality, {
  topic: null,
  post: null,
  post_name: '',
  post_quote: '',
  callbacks: {
    onShow: null,
    onDestroy: null
  },

  init() {
    this._super(...arguments)
    this.appEvents.on('babble-dmodal:closed',()=>{
      this.onDestroy()
    })
  },

  @computed('post_name')
  post_user_url(post_name) {
    return userPath(post_name)
  },

  onShow() {
    $('#discourse-modal').addClass('babble-post-actions-modal')
    if (this.get('callbacks').onShow) {
      this.get('callbacks').onShow(this)
    }
  },

  onDestroy() {
    if (this.get('callbacks').onDestroy) {
      this.get('callbacks').onDestroy()
    }
    $('#discourse-modal').removeClass('babble-post-actions-modal')
  },

  actions: {
    reply() {
      Babble.replyPost(this.get('topic'), this.get('post'))
      this.appEvents.trigger('babble-composer:rerender')
      this.send('closeModal')
    },
    edit() {
      Babble.editPost(this.get('topic'), this.get('post'))
      this.appEvents.trigger('babble-composer:rerender')
      this.send('closeModal')
    },
    delete() {
      Babble.destroyPost(this.get('topic'), this.get('post'))
      this.send('closeModal')
    },
    copy() {
      if (!window.getSelection) { return }
      const pn = this.get('post').get('post_number')
      const ePostCooked = $(`li[data-post-number=${pn}] .babble-post-cooked`)[0]
      const range = document.createRange()
      range.selectNodeContents(ePostCooked)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
      try {
        document.execCommand ("copy", false, null)
      } catch(e) {
        console.log("Your browser doesn't support copy!")
        console.log(selection.toString())
      }
      selection.removeAllRanges()
      this.send('closeModal')
    }
  }
})