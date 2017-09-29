import EmojiPicker from 'discourse/components/emoji-picker'
import { on, observes }  from 'ember-addons/ember-computed-decorators'
export default EmojiPicker.extend({
    @on('didInsertElement')
    addOpenEvent() {
      console.log('start')
      this.$picker = this.$(".emoji-picker");
      this.$modal = this.$(".emoji-picker-modal");
      this.$modal.on("click", () => {
        this.set("active", false)
        this.hide()
      })
      this.appEvents.on("babble-emoji-picker:open", () => {
        this.set("active", true);
        this.set("forBabble", true);
        this._positionPicker();
        this.show();
      });
      this.appEvents.on("babble-emoji-picker:close", () => {
        this.set("active", false);
        this.set("forBabble", true);
        this.hide();
      });
    },

    @on('willDestroyElement')
    removeOpenEvent() {
      this.close();
      this.appEvents.off("babble-emoji-picker:close");
    },

    _positionPicker(){
      if (!this.get('forBabble')
         || !this.get('active')) return this._super();

      let windowWidth = this.$(window).width();

      let attributes = {
        width: Math.min(windowWidth, 400) - 12,
        marginLeft: -(Math.min(windowWidth, 400)/2) + 6,
        marginTop: -130,
        left: "50%",
        bottom: "",
        top: "50%",
        display: "flex"
      };

      this.$(".emoji-picker-modal").addClass("fadeIn");
      this.$(".emoji-picker").css(attributes);
    },

    show() {
      this._super()
      this.$picker.show()
      this.$modal.show()
    },

    hide() {
      this.$picker.hide().empty()
      this.$modal.hide()
    }
  })