import { queryRegistry } from 'discourse/widgets/widget'
import { withPluginApi } from 'discourse/lib/plugin-api'
import reopenWidget      from '../lib/reopen-widget'
import { on, observes }  from 'ember-addons/ember-computed-decorators'
import Topic from 'discourse/models/topic'
import BEmojiComponent from '../components/babble-emoji-picker'

export default {
  name: 'babble-common-init',
  initialize() {
    // sorry mom
    withPluginApi('0.8.9', api => {
      let _super = queryRegistry('notification-item').prototype.url
      api.reopenWidget('notification-item', {
        url() {
          if (!this.attrs.data.chat) { return _super.apply(this) }
          return `/chat/${this.attrs.slug}/${this.attrs.topic_id}/${this.attrs.post_number}`
        }
      })
    })
    Topic.reopen({
      url: function() {
        let slug = this.get('slug') || ''
        if (slug.trim().length === 0) {
          slug = "topic"
        }
        if (this.get('archetype')!=='chat')
          return Discourse.getURL("/t/") + slug + "/" + (this.get('id'))
        else
          return Discourse.getURL("/chat/") + this.get('category.fullSlug')+ "/" + (this.get('id'))
      }.property('id','slug'),

      urlForPostNumber() {
        if (this.get('archetype')!=='chat') {
          return this._super(...arguments)
        } else {
          return this.get('url')
        }
      }
    })
    BEmojiComponent.reopen({})
  }
}
