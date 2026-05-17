import { gql } from 'apollo-angular'

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

export const HOME_FEED_QUERY = gql`
  query Feed($first: Int, $after: String) {
    feed(first: $first, after: $after) {
      edges {
        cursor
        node {
          ...PostCardFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${POST_CARD_FRAGMENT}
`

export const DISCOVER_FEED_QUERY = gql`
  query DiscoverFeed($category: String, $limit: Int, $offset: Int) {
    discoverFeed(category: $category, limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`

export const USER_POSTS_QUERY = gql`
  query UserPosts($userId: ID!, $limit: Int, $offset: Int) {
    userPosts(userId: $userId, limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`

export const SAVED_POSTS_QUERY = gql`
  query SavedPosts($limit: Int, $offset: Int) {
    savedPosts(limit: $limit, offset: $offset) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`

export const TOGGLE_LIKE_MUTATION = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      postId
      liked
      likes
    }
  }
`

export const TOGGLE_SAVE_MUTATION = gql`
  mutation ToggleSave($postId: ID!) {
    toggleSave(postId: $postId) {
      postId
      saved
    }
  }
`

export const TOGGLE_FOLLOW_MUTATION = gql`
  mutation ToggleFollow($userId: ID!) {
    toggleFollow(userId: $userId) {
      userId
      following
    }
  }
`

export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($content: String, $title: String, $imageUrl: String) {
    createPost(content: $content, title: $title, imageUrl: $imageUrl) {
      ...PostCardFields
    }
  }
  ${POST_CARD_FRAGMENT}
`

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

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`

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
      is_private
      isViewable
    }
  }
`

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

export const CHECK_USERNAME_QUERY = gql`
  query CheckUsername($username: String!) {
    checkUsername(username: $username) {
      valid
      available
      reason
    }
  }
`

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
