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
  query DiscoverFeed($limit: Int, $offset: Int) {
    discoverFeed(limit: $limit, offset: $offset) {
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
      posts_count
      followers_count
      following_count
      isFollowing
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
