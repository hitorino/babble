import { createWidget } from 'discourse/widgets/widget'
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'
import { scrollToPost } from '../lib/chat-element-utils'

$.fn.longPress = function(duration, fn, fnRelease) {
  var timeout = undefined
  let start = new Array(this.length)
  const moveDistance = (t0, t1) => Math.sqrt(
    Math.pow(t0.pageX-t1.pageX, 2) + Math.pow(t0.pageY-t1.pageY, 2)
  )
  const preventExecution = ($el)=> {
    $el.removeClass('touch-disable-selection')
    if (timeout === undefined) {
      return false
    } else {
      clearTimeout(timeout) // If press remains shorter than given duration, the fn will not be called
      timeout = undefined
      return true
    }
  }
  const onRelease = ()=> {
    if (fnRelease)
      fnRelease()
    start = new Array(this.length)
    clearTimeout(timeout)
    timeout = undefined
    $(this).removeClass('touch-disable-selection')
  }
  for(var i = 0;i<this.length;i++){
    this[i].addEventListener('touchstart', (event) => {
      $(this).addClass('touch-disable-selection')
      start[i] = event.touches[0]
      // If press remains longer than given duration, the fn will be called
      timeout = setTimeout(fn, duration)
      return false
    }, true)
    this[i].addEventListener('touchmove', (event) => {
      if (start[i] && moveDistance(event.touches[0], start[i]) > 200) {
        // The user moves their finger too far
        // they may want to scroll the screen.
        if (preventExecution($(this))) {
          onRelease(i)
        }
      }
      return false
    }, false)
    this[i].addEventListener('touchend', () => {
      onRelease(i)
      return false
    }, false)
  }
  return this
}

export function getPostContent (topic, postNumber) {
  if (!postNumber) {
    return {username: '', content: ''}
  }
  const post = topic.postStream.posts.findBy('post_number',postNumber)
  if (!post) {
    return {username: '', content: ''}
  }
  return {
    username: post.get('username'),
    content: $(post.get('cooked')).text()
  }
}

export default createWidget('babble-post', {
  tagName: 'li.babble-post',
  postActionController: null,

  buildKey(attrs) {
    return `babble-post-${attrs.post.id}`
  },

  buildAttributes() {
    let post = this.state.post
    let topic = this.state.topic
    return {
      'data-post-id':     post.id,
      'data-user-id':     post.user_id,
      'data-post-number': post.post_number,
      'data-topic-id':    topic.id
    }
  },

  defaultState(attrs) {
    return {
      post:       attrs.post,
      topic:      attrs.topic,
      isFollowOn: attrs.isFollowOn,
      isNewDay:   attrs.isNewDay,
      editedRaw:  attrs.post.raw
    }
  },

  edit() {
    Babble.editPost(this.state.topic, this.state.post)
  },

  delete() {
    Babble.destroyPost(this.state.topic, this.state.post)
  },

  jumpToReply() {
    scrollToPost(this.state.topic, this.state.post.get('reply_to_post_number'))
  },

  replyThis() {
    this.appEvents.trigger('babble-composer:reply', this.state.post.get('post_number'));
  },

  html() {
    const $sel = $(`li[data-post-number=${this.state.post.get('post_number')}]`)
    const isMobile = $('html').hasClass('mobile-view')
    const $tgt = (isMobile?$sel.find('div.babble-post-content'):$sel)
    const handler = () => {
      this.appEvents.trigger('babble-post-actions:show',{
        topic: this.state.topic,
        post: this.state.post
      })
    }
    if (isMobile) {
      $tgt.on('contextmenu', '*', ()=>false).longPress(1200, handler)
    }
    $tgt.dblclick(handler)
    return template.render(this)
  }
})
