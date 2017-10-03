import { createWidget } from 'discourse/widgets/widget'
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'
import { scrollToPost } from '../lib/chat-element-utils'
import showModal from 'discourse/lib/show-modal'

$.fn.longPress = function(length, fn, fnRelease) {
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
      clearTimeout(timeout) // If press shorter than 2000ms, the fn will not be called
      timeout = undefined
      return true
    }
  }
  const onRelease = (i)=> {
    if (fnRelease)
      fnRelease()
    start[i] = null
    clearTimeout(timeout)
    timeout = undefined
    $(this[i]).removeClass('touch-disable-selection')
  }
  for(var i = 0;i<this.length;i++){
    this[i].addEventListener('touchstart', (event) => {
      $(this[i]).addClass('touch-disable-selection')
      start[i] = event.touches[0]
      timeout = setTimeout(fn, length) // If press longer than 2000ms, the fn will not be called
      return false
    }, false)
    this[i].addEventListener('touchmove', (event) => {
      if (start[i] && moveDistance(event.touches[0], start[i]) > 20) {
        if (preventExecution($(this[i]))) {
          onRelease(i)
        }
      }
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

  showActions (callback) {
    let post = this.state.post
    showModal('babblePostActions').setProperties({
      post_name: post.get('username'),
      post_quote: $(post.get('cooked')).text(),
      topic: this.state.topic,
      post: post,
      callback
    })
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
    Ember.run.scheduleOnce('afterRender', () => {
      const $sel = $(`li[data-post-number=${this.state.post.get('post_number')}]`)
      const $tgt = $('html').hasClass('mobile-view')?
        $sel.find('div.babble-post-content') :
        $sel
      const setupActions = (cb)=>{
        this.showActions(()=>{
          $sel.removeClass('selected')
        })
        $sel.addClass('selected')
        if (cb) {
          Ember.run.scheduleOnce('afterRender', cb)
        }
      }
      $tgt.longPress(2000, ()=>{
        setupActions(function () {
          $('.modal-backdrop').css('display','none')
        })
      }).dblclick(()=>{
        setupActions(function () {
          $('.modal-backdrop').off('click.babble-post-action-remove')

          $('.modal-backdrop').on(
            'click.babble-post-action-remove',
            ()=>$sel.removeClass('selected')
          )
          
        })
      })
    })
    return template.render(this)
  }
})
