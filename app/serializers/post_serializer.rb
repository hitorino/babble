class ::Babble::PostSerializer < ActiveModel::Serializer
  attributes :id,
             :user_id,
             :name,
             :username,
             :user_deleted,
             :avatar_template,
             :can_delete,
             :can_edit,
             :cooked,
             :raw,
             :post_number,
             :topic_id,
             :created_at,
             :updated_at,
             :deleted_at,
             :deleted_by_username,
             :yours,
             :self_edits,
             :reply_to_post_number

  def yours
    scope.user == object.user
  end

  def can_edit
    scope.can_edit?(object)
  end

  def can_delete
    scope.can_delete?(object)
  end

  def deleted_by_username
    object.deleted_by.username
  end

  def avatar_template
    object.user.try(:avatar_template)
  end

  def name
    object.user.try(:name)
  end

  def username
    object.user.try(:username)
  end

  private

  def include_deleted_by_username?
    object.deleted_at.present?
  end
end
