export default {
  actions: {
    emojiSelected(code) {
      const textarea = $('.babble-composer-wrapper textarea');
      textarea.val(textarea.val() + `:${code}:`);
      const appEvents = Discourse.__container__.lookup('app-events:main');
      appEvents.trigger('babble-emoji-picker:close');
    }
  }
}
