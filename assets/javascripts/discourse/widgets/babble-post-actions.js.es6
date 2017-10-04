import { createWidget } from 'discourse/widgets/widget'
import template from '../widgets/templates/babble-post-actions'
import Babble from '../lib/babble'

export default createWidget('babble-post-actions', {
  buildKey() {
    return 'babblePostActions'
  },

  defaultState() {
    return {
      topic: null,
      post: null,
      show: false,
      onClose: null,
    }
  },

  close() {
    this.state.show = false
    this.state.post = null
    this.state.topic = null
    if (this.state.onClose) {
      this.state.onClose()
    }
    this.state.onClose = null
    this.appEvents.trigger('babble-composer:rerender')
    this.scheduleRerender()
  },

  reply() {
    Babble.replyPost(this.state.topic, this.state.post)
    this.close()
  },

  edit() {
    Babble.editPost(this.state.topic, this.state.post)
    this.close()
  },

  delete() {
    Babble.destroyPost(this.state.topic, this.state.post)
    this.close()
  },

  copy() {
    if (!window.getSelection) { return }
    const pn = this.state.post.get('post_number')
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
    this.close()
  },

  html() {
    this.appEvents.off('babble-post-actions:close')
    this.appEvents.on('babble-post-actions:close', ()=>this.close())
    this.appEvents.off('babble-post-actions:show')
    this.appEvents.on('babble-post-actions:show', ({topic, post, onShow=null, onClose=null}) => {
      if (this.state.onClose) {
        this.state.onClose()
      }
      this.state.topic = topic
      this.state.post = post
      this.state.show = true
      if (onShow) {
        onShow()
      }
      this.state.onClose = onClose
      this.scheduleRerender()
    })
    return template.render(this)
  },
})
