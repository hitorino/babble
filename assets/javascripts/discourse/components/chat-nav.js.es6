import Babble from '../lib/babble'
import BabbleRegistry from '../lib/babble-registry'

export default Ember.Component.extend({
  tagName: 'a',
  classNameBindings: ['active'],

  icon: function() {
    return Discourse.SiteSettings.babble_icon
  }.property(),

  hasUnread: function() {
    return this.get('allUnreadCount') > 0
  }.property(),

  unread: function() {
    return BabbleRegistry.get('allUnreadCount')
  }.property(),

  click() {
    this.sendAction("action", this.get("actionParam"));
    return false;
  }
});
