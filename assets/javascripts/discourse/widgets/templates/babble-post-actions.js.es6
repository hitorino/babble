import { h } from 'virtual-dom'

export default Ember.Object.create({
  render(widget) {
    this.widget = widget
    this.state = widget.state
    if (this.state.show) {
      return h('div.babble-post-actions', [
        this.widget.attach('link', {
          className: 'close',
          icon: 'times',
          action: 'close',
          title: 'babble.close_window'
        }),
        this.widget.attach('link', {
          className: 'copy',
          icon: 'copy',
          action: 'copy',
          title: 'babble.copy'
        }),
        this.widget.attach('link', {
          className: 'reply',
          icon: 'reply',
          action: 'reply',
          title: 'babble.reply'
        }),
        this.widget.attach('link', {
          className: 'edit',
          icon: 'pencil',
          action: 'edit',
          title: 'babble.edit'
        }),
        this.widget.attach('link', {
          className: 'delete',
          icon: 'trash',
          action: 'delete',
          title: 'babble.delete'
        })
      ])
    } else {
      return h('div.babble-post-actions', {
        style: {
          display: 'none'
        }
      })
    }
  }

})
