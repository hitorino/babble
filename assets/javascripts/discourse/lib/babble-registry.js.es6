export default Ember.Object.create({
  _topics: {},
  _components: {},
  _bindings: new Set(),

  bind(component, topic) {
    this._bindings.add([
      this.store(topic, '_topics', 'id').id,
      this.store(component, '_components', 'elementId').elementId
    ])
    return this.topicForComponent(component)
  },

  unbind(component) {
    let componentBinding = _.find([...this._bindings], ([x, elementId]) => { return elementId == component.elementId })
    this._bindings.delete(componentBinding)
  },

  store(model, cache, field) {
    if (!this[cache][model[field]]) { this[cache][model[field]] = model }
    return this[cache][model[field]]
  },

  componentsForTopic(topic) {
    let elementIds = _.filter([...this._bindings], ([topicId, x]) => { return topicId == topic.id })
                      .map((c) => { return c[1] })
    return _.values(_.pick(this._components, elementIds))
  },

  topicForComponent(component) {
    let [topicId, x] = _.find([...this._bindings], ([x, elementId]) => { return elementId == component.elementId }) || []
    return this._topics[topicId]
  },

  allUnreadCount: function() {
    return _.values(this._topics).map((t) => t.get('unreadCount')>0?t.get('unreadCount'):0).reduce((sn,an) => sn+ax,0)
  }.property('_topics.@each.unreadCount'),

  allAdditionalUnread: function() {
    return _.values(this._topics).map((t) => t.get('hasAdditionalUnread')).reduce((sn,an) => sn || ax,false)
  }.property('_topics.@each.hasAdditionalUnread'),
  
  allVisibleUnreadCount: function() {
    return this.get('allUnreadCount')<=0 ? '' : `${this.get('allUnreadCount')}${this.get('allAdditionalUnread') ? '+' : ''}`
  }.property('allUnreadCount','allAdditionalUnread')

})
