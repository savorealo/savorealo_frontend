import { gql } from 'apollo-angular'
/**
 * Fragmento GraphQL para post card fragment.
 */
export const POST_CARD_FRAGMENT = gql`
  fragment PostCardFields on posts {
    id
    post_type
    title
    description
    created_at
    likes_count
    comments_count
    saves_count
    liked
    saved
    categories
    author {
      id
      username
      display_name
      avatar_url
    }
    post_media {
      id
      media_url
      media_type
      position
    }
    recipe {
      id
      name
      description
      steps
      time_required
      estimated_cost
      servings
      difficulty
    }
  }
`
/**
 * Consulta GraphQL para home feed query.
 */
export const HOME_FEED_QUERY = gql`
  query Feed($limit: Int, $offset: Int) {
    feed(limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Consulta GraphQL para discover feed query.
 */
export const DISCOVER_FEED_QUERY = gql`
  query DiscoverFeed($category: String, $limit: Int, $offset: Int) {
    discoverFeed(category: $category, limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Consulta GraphQL para user posts query.
 */
export const USER_POSTS_QUERY = gql`
  query UserPosts($userId: ID!, $limit: Int, $offset: Int) {
    userPosts(userId: $userId, limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Consulta GraphQL para saved posts query.
 */
export const SAVED_POSTS_QUERY = gql`
  query SavedPosts($limit: Int, $cursor: String) {
    savedPosts(limit: $limit, cursor: $cursor) {
      posts {
        ...PostCardFields
      }
      nextCursor
      hasNextPage
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Mutación GraphQL para toggle like mutation.
 */
export const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      postId
      liked
      likes
    }
  }
`
/**
 * Mutación GraphQL para toggle save mutation.
 */
export const TOGGLE_SAVE_MUTATION = gql`
  mutation ToggleSave($postId: ID!) {
    toggleSave(postId: $postId) {
      postId
      saved
      saves
    }
  }
`
/**
 * Mutación GraphQL para toggle follow mutation.
 */
export const TOGGLE_FOLLOW_MUTATION = gql`
  mutation ToggleFollow($userId: ID!) {
    toggleFollow(userId: $userId) {
      userId
      following
      requested
    }
  }
`
/**
 * Mutación GraphQL para create post mutation.
 */
export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($content: String, $title: String, $imageUrl: String) {
    createPost(content: $content, title: $title, imageUrl: $imageUrl) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Mutación GraphQL para create recipe post mutation.
 */
export const CREATE_RECIPE_POST_MUTATION = gql`
  mutation CreateRecipePost(
    $content: String!
    $imageUrl: String
    $recipeName: String!
    $difficulty: String
    $timeRequired: Int
    $servings: Int
    $ingredients: [IngredientInput!]!
    $steps: [StepInput!]!
  ) {
    createRecipePost(
      content: $content
      imageUrl: $imageUrl
      recipeName: $recipeName
      difficulty: $difficulty
      timeRequired: $timeRequired
      servings: $servings
      ingredients: $ingredients
      steps: $steps
    ) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Consulta GraphQL para post comments query.
 */
export const POST_COMMENTS_QUERY = gql`
  query Comments($postId: ID!) {
    comments(postId: $postId) {
      id
      text
      created_at
      author {
        id
        username
        display_name
        avatar_url
      }
    }
  }
`
/**
 * Mutación GraphQL para add comment mutation.
 */
export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($postId: ID!, $text: String!) {
    addComment(postId: $postId, text: $text) {
      id
      text
      created_at
      author {
        id
        username
        display_name
        avatar_url
      }
    }
  }
`
/**
 * Mutación GraphQL para delete comment mutation.
 */
export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`
/**
 * Consulta GraphQL para get user query.
 */
export const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      display_name
      avatar_url
      bio
      location
      posts_count
      followers_count
      following_count
      isFollowing
      followStatus
      is_private
      isViewable
      isFollowingViewer
    }
  }
`
/**
 * Consulta GraphQL para search users query.
 */
export const SEARCH_USERS_QUERY = gql`
  query SearchUsers($q: String!, $limit: Int = 20, $offset: Int = 0) {
    searchUsers(query: $q, limit: $limit, offset: $offset) {
      id
      username
      display_name
      avatar_url
      followers_count
      isFollowing
    }
  }
`
/**
 * Consulta GraphQL para check username query.
 */
export const CHECK_USERNAME_QUERY = gql`
  query CheckUsername($username: String!) {
    checkUsername(username: $username) {
      valid
      available
      reason
    }
  }
`
/**
 * Consulta GraphQL para suggested users query.
 */
export const SUGGESTED_USERS_QUERY = gql`
  query SuggestedUsers($preferenceIds: [ID!]!, $limit: Int) {
    suggestedUsers(preferenceIds: $preferenceIds, limit: $limit) {
      id
      username
      display_name
      avatar_url
      isFollowing
    }
  }
`
/**
 * Consulta GraphQL para my settings query.
 */
export const MY_SETTINGS_QUERY = gql`
  query MySettings {
    mySettings {
      is_private
      language
      theme
      notify_likes
      notify_comments
      notify_follows
    }
  }
`
/**
 * Mutación GraphQL para update settings mutation.
 */
export const UPDATE_SETTINGS_MUTATION = gql`
  mutation UpdateSettings(
    $is_private: Boolean
    $language: String
    $theme: String
    $notify_likes: Boolean
    $notify_comments: Boolean
    $notify_follows: Boolean
  ) {
    updateSettings(
      is_private: $is_private
      language: $language
      theme: $theme
      notify_likes: $notify_likes
      notify_comments: $notify_comments
      notify_follows: $notify_follows
    ) {
      is_private
      language
      theme
      notify_likes
      notify_comments
      notify_follows
    }
  }
`
/**
 * Mutación GraphQL para update profile mutation.
 */
export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $username: String
    $display_name: String
    $avatar_url: String
    $bio: String
    $location: String
    $birth_date: String
    $business_name: String
    $specialty: String
    $phone: String
    $website: String
  ) {
    updateProfile(
      username: $username
      display_name: $display_name
      avatar_url: $avatar_url
      bio: $bio
      location: $location
      birth_date: $birth_date
      business_name: $business_name
      specialty: $specialty
      phone: $phone
      website: $website
    ) {
      id
      username
      display_name
      avatar_url
    }
  }
`
/**
 * Consulta GraphQL para followers query.
 */
export const FOLLOWERS_QUERY = gql`
  query Followers($userId: ID!, $limit: Int, $offset: Int) {
    followers(userId: $userId, limit: $limit, offset: $offset) {
      id
      username
      display_name
      avatar_url
      isFollowing
      followStatus
    }
  }
`
/**
 * Consulta GraphQL para following query.
 */
export const FOLLOWING_QUERY = gql`
  query Following($userId: ID!, $limit: Int, $offset: Int) {
    following(userId: $userId, limit: $limit, offset: $offset) {
      id
      username
      display_name
      avatar_url
      isFollowing
      followStatus
    }
  }
`
/**
 * Consulta GraphQL para notifications query.
 */
export const NOTIFICATIONS_QUERY = gql`
  query Notifications($limit: Int, $offset: Int) {
    notifications(limit: $limit, offset: $offset) {
      id
      type
      content
      isRead
      createdAt
      targetId
      actor {
        id
        username
        display_name
        avatar_url
      }
    }
  }
`
/**
 * Consulta GraphQL para unread notifications count query.
 */
export const UNREAD_NOTIFICATIONS_COUNT_QUERY = gql`
  query UnreadNotificationsCount {
    unreadNotificationsCount
  }
`
/**
 * Mutación GraphQL para mark notification read mutation.
 */
export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`
/**
 * Mutación GraphQL para mark all notifications read mutation.
 */
export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`
/**
 * Mutación GraphQL para respond follow request mutation.
 */
export const RESPOND_FOLLOW_REQUEST_MUTATION = gql`
  mutation RespondFollowRequest($actorId: ID!, $accept: Boolean!) {
    respondFollowRequest(actorId: $actorId, accept: $accept) {
      requestId
      accepted
    }
  }
`
/**
 * Consulta GraphQL para pending follow requests query.
 */
export const PENDING_FOLLOW_REQUESTS_QUERY = gql`
  query PendingFollowRequests($limit: Int, $offset: Int) {
    pendingFollowRequests(limit: $limit, offset: $offset) {
      id
      status
      createdAt
      requester {
        id
        username
        display_name
        avatar_url
      }
    }
  }
`
/**
 * Consulta GraphQL para liked posts query.
 */
export const LIKED_POSTS_QUERY = gql`
  query LikedPosts($limit: Int, $offset: Int) {
    likedPosts(limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`
/**
 * Mutación GraphQL para delete post mutation.
 */
export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId) {
      success
    }
  }
`
/**
 * Mutación GraphQL para remove follower mutation.
 */
export const REMOVE_FOLLOWER_MUTATION = gql`
  mutation RemoveFollower($userId: ID!) {
    removeFollower(userId: $userId)
  }
`
