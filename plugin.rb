# name: babble
# about: Shoutbox plugin for Discourse
# version: 3.1.8
# authors: James Kiesel (gdpelican)
# url: https://github.com/gdpelican/babble

register_asset "stylesheets/babble.scss"

enabled_site_setting :babble_enabled

def babble_require(path)
  require Rails.root.join('plugins', 'babble', 'app', path).to_s
end

babble_require 'extras/position_options'

after_initialize do

  babble_require 'initializers/babble'

  babble_require 'routes/babble'
  babble_require 'routes/discourse'

  babble_require 'controllers/controller'
  babble_require 'controllers/admin/chats_controller'
  babble_require 'controllers/topics_controller'
  babble_require 'controllers/posts_controller'

  babble_require 'serializers/notification_serializer'
  babble_require 'serializers/post_serializer'
  babble_require 'serializers/topic_serializer'

  babble_require 'services/post_creator'
  babble_require 'services/post_destroyer'
  babble_require 'services/post_revisor'
  babble_require 'services/broadcaster'
  babble_require 'services/post_stream_window'

  babble_require 'models/archetype'
  babble_require 'models/guardian'
  babble_require 'models/topic'
  babble_require 'models/user_action'
  babble_require 'models/user_summary'

  Category.register_custom_field_type('chat_topic_id', :integer)
  add_to_serializer(:basic_category, :chat_topic_id) { object.custom_fields['chat_topic_id'] unless object.custom_fields['chat_topic_id'].to_i == 0 }
  add_to_serializer(:basic_topic, :category_id)      { object.category_id if object.respond_to?(:category_id) }

  class ::Topic

    module ForDigest
      def for_digest(user, since, opts=nil)
        super(user, since, opts).where('archetype <> ?', Archetype.chat)
      end
    end

    module TopicURL
      def chat?(id)
        result = Topic.find_by_sql [
          "SELECT 1 FROM topics WHERE id = ? AND archetype = 'chat'",
          id]
        result.length==1
      end
      def url(id, slug, post_number = nil)
        url = "#{Discourse.base_url}"
        unless Topic.chat?(id)
          url << "/t/#{slug}/#{id}"
          url << "/#{post_number}" if post_number.to_i > 1
        else
          url << "/chat/#{id}"
        end
        url
      end
    end

    singleton_class.prepend ForDigest
    singleton_class.prepend TopicURL
  end

  TopicListItemSerializer.class_eval do
    attributes :archetype
  end

  class ::PostAlerter
    define_method(:notify_non_pm_users) do |users, type, post, opts = {}|
      return if post.topic.archetype=='chat'
      return if post.topic.try(:private_message?)

      users = [users] unless users.is_a?(Array)

      users.each do |u|
        create_notification(u, Notification.types[type], post, opts)
      end
    end
  end

end
