import { createWidget } from 'discourse/widgets/widget';
import Babble from '../lib/babble'
import template from '../widgets/templates/babble-post'
import { ajax } from 'discourse/lib/ajax'
import { scrollToPost } from '../lib/chat-element-utils'
import showModal from 'discourse/lib/show-modal'

$.fn.longPress = function(fn) {
  var timeout = undefined;
  var $this = this;
  for(var i = 0;i<$this.length;i++){
      $this[i].addEventListener('touchstart', function(event) {
          timeout = setTimeout(fn, 800);  //长按时间超过800ms，则执行传入的方法
          }, false);
      $this[i].addEventListener('touchend', function(event) {
          clearTimeout(timeout);  //长按时间少于800ms，不会执行传入的方法
          }, false);
  }
}

export function getPostContent (topic, postNumber) {
  if (!postNumber) {
    return {username: '', content: ''}
  }
  const post = topic.postStream.posts.findBy('post_number',postNumber)
  if (!post) {
    return {username: '', content: ''}
  }
//  const $pc = $(`li[data-post-number=${postNumber}] .babble-post-content`)
  return {
    username: post.get('username'), //$pc.find('.babble-post-name').text(),
    content: $(post.get('cooked')).text()//$pc.find('.babble-post-cooked').text()
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

  showActions () {
    let post = this.state.post
    showModal('babblePostActions').setProperties({
      post_name: post.get('username'),
      post_quote: $(post.get('cooked')).text(),
      topic: this.state.topic,
      post: post
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
    const $sel = $(`li[data-post-number=${this.state.post.get('post_number')}]`)
    $sel.longPress(()=>this.showActions())
    $sel.dblclick(()=>this.showActions())
    return template.render(this)
  }
})
