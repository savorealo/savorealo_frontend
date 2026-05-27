'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">cookeealo documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AddReviewModal.html" data-type="entity-link" >AddReviewModal</a>
                            </li>
                            <li class="link">
                                <a href="components/AiIdeasPanel.html" data-type="entity-link" >AiIdeasPanel</a>
                            </li>
                            <li class="link">
                                <a href="components/AiRecipeForm.html" data-type="entity-link" >AiRecipeForm</a>
                            </li>
                            <li class="link">
                                <a href="components/AiRecipeResult.html" data-type="entity-link" >AiRecipeResult</a>
                            </li>
                            <li class="link">
                                <a href="components/AiRecipesHero.html" data-type="entity-link" >AiRecipesHero</a>
                            </li>
                            <li class="link">
                                <a href="components/AiRecipesPage.html" data-type="entity-link" >AiRecipesPage</a>
                            </li>
                            <li class="link">
                                <a href="components/App.html" data-type="entity-link" >App</a>
                            </li>
                            <li class="link">
                                <a href="components/AppShell.html" data-type="entity-link" >AppShell</a>
                            </li>
                            <li class="link">
                                <a href="components/Auth.html" data-type="entity-link" >Auth</a>
                            </li>
                            <li class="link">
                                <a href="components/Avatar.html" data-type="entity-link" >Avatar</a>
                            </li>
                            <li class="link">
                                <a href="components/Body.html" data-type="entity-link" >Body</a>
                            </li>
                            <li class="link">
                                <a href="components/Body-1.html" data-type="entity-link" >Body</a>
                            </li>
                            <li class="link">
                                <a href="components/Body-2.html" data-type="entity-link" >Body</a>
                            </li>
                            <li class="link">
                                <a href="components/ButtonComponent.html" data-type="entity-link" >ButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CallHost.html" data-type="entity-link" >CallHost</a>
                            </li>
                            <li class="link">
                                <a href="components/CallOverlay.html" data-type="entity-link" >CallOverlay</a>
                            </li>
                            <li class="link">
                                <a href="components/ChatPanel.html" data-type="entity-link" >ChatPanel</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentSection.html" data-type="entity-link" >CommentSection</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentsSheetComponent.html" data-type="entity-link" >CommentsSheetComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConversationList.html" data-type="entity-link" >ConversationList</a>
                            </li>
                            <li class="link">
                                <a href="components/CookingModePage.html" data-type="entity-link" >CookingModePage</a>
                            </li>
                            <li class="link">
                                <a href="components/CreatePostComponent.html" data-type="entity-link" >CreatePostComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditProfileComponent.html" data-type="entity-link" >EditProfileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EmojiRain.html" data-type="entity-link" >EmojiRain</a>
                            </li>
                            <li class="link">
                                <a href="components/Emptystate.html" data-type="entity-link" >Emptystate</a>
                            </li>
                            <li class="link">
                                <a href="components/ExploreCategoryTabs.html" data-type="entity-link" >ExploreCategoryTabs</a>
                            </li>
                            <li class="link">
                                <a href="components/ExploreHero.html" data-type="entity-link" >ExploreHero</a>
                            </li>
                            <li class="link">
                                <a href="components/ExplorePage.html" data-type="entity-link" >ExplorePage</a>
                            </li>
                            <li class="link">
                                <a href="components/ExploreRightRail.html" data-type="entity-link" >ExploreRightRail</a>
                            </li>
                            <li class="link">
                                <a href="components/ExploreToolbar.html" data-type="entity-link" >ExploreToolbar</a>
                            </li>
                            <li class="link">
                                <a href="components/FeedPage.html" data-type="entity-link" >FeedPage</a>
                            </li>
                            <li class="link">
                                <a href="components/FeedPostList.html" data-type="entity-link" >FeedPostList</a>
                            </li>
                            <li class="link">
                                <a href="components/FeedRightRail.html" data-type="entity-link" >FeedRightRail</a>
                            </li>
                            <li class="link">
                                <a href="components/GlobalSearchPanel.html" data-type="entity-link" >GlobalSearchPanel</a>
                            </li>
                            <li class="link">
                                <a href="components/Header.html" data-type="entity-link" >Header</a>
                            </li>
                            <li class="link">
                                <a href="components/Header-1.html" data-type="entity-link" >Header</a>
                            </li>
                            <li class="link">
                                <a href="components/Header-2.html" data-type="entity-link" >Header</a>
                            </li>
                            <li class="link">
                                <a href="components/Home.html" data-type="entity-link" >Home</a>
                            </li>
                            <li class="link">
                                <a href="components/IncomingCall.html" data-type="entity-link" >IncomingCall</a>
                            </li>
                            <li class="link">
                                <a href="components/Login.html" data-type="entity-link" >Login</a>
                            </li>
                            <li class="link">
                                <a href="components/MessageBubble.html" data-type="entity-link" >MessageBubble</a>
                            </li>
                            <li class="link">
                                <a href="components/MessagesPage.html" data-type="entity-link" >MessagesPage</a>
                            </li>
                            <li class="link">
                                <a href="components/NewConversation.html" data-type="entity-link" >NewConversation</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationsPage.html" data-type="entity-link" >NotificationsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/PlaceCard.html" data-type="entity-link" >PlaceCard</a>
                            </li>
                            <li class="link">
                                <a href="components/PlaceDetailPage.html" data-type="entity-link" >PlaceDetailPage</a>
                            </li>
                            <li class="link">
                                <a href="components/PlacesPage.html" data-type="entity-link" >PlacesPage</a>
                            </li>
                            <li class="link">
                                <a href="components/PostCard.html" data-type="entity-link" >PostCard</a>
                            </li>
                            <li class="link">
                                <a href="components/PostDetailPage.html" data-type="entity-link" >PostDetailPage</a>
                            </li>
                            <li class="link">
                                <a href="components/Profile.html" data-type="entity-link" >Profile</a>
                            </li>
                            <li class="link">
                                <a href="components/PublicProfilePage.html" data-type="entity-link" >PublicProfilePage</a>
                            </li>
                            <li class="link">
                                <a href="components/RecentAiRecipes.html" data-type="entity-link" >RecentAiRecipes</a>
                            </li>
                            <li class="link">
                                <a href="components/RecipeDiscoveryCard.html" data-type="entity-link" >RecipeDiscoveryCard</a>
                            </li>
                            <li class="link">
                                <a href="components/RecipeDiscoveryGrid.html" data-type="entity-link" >RecipeDiscoveryGrid</a>
                            </li>
                            <li class="link">
                                <a href="components/RecipeOfDayCard.html" data-type="entity-link" >RecipeOfDayCard</a>
                            </li>
                            <li class="link">
                                <a href="components/Register.html" data-type="entity-link" >Register</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportSheet.html" data-type="entity-link" >ReportSheet</a>
                            </li>
                            <li class="link">
                                <a href="components/SavedCollectionStrip.html" data-type="entity-link" >SavedCollectionStrip</a>
                            </li>
                            <li class="link">
                                <a href="components/SavedPage.html" data-type="entity-link" >SavedPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SavedRecipeCard.html" data-type="entity-link" >SavedRecipeCard</a>
                            </li>
                            <li class="link">
                                <a href="components/SavoLoader.html" data-type="entity-link" >SavoLoader</a>
                            </li>
                            <li class="link">
                                <a href="components/SettingsPage.html" data-type="entity-link" >SettingsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SharedPostCard.html" data-type="entity-link" >SharedPostCard</a>
                            </li>
                            <li class="link">
                                <a href="components/SharedProfileCard.html" data-type="entity-link" >SharedProfileCard</a>
                            </li>
                            <li class="link">
                                <a href="components/SharePostModal.html" data-type="entity-link" >SharePostModal</a>
                            </li>
                            <li class="link">
                                <a href="components/ShareProfileModal.html" data-type="entity-link" >ShareProfileModal</a>
                            </li>
                            <li class="link">
                                <a href="components/ShoppingListPage.html" data-type="entity-link" >ShoppingListPage</a>
                            </li>
                            <li class="link">
                                <a href="components/SkeletonCard.html" data-type="entity-link" >SkeletonCard</a>
                            </li>
                            <li class="link">
                                <a href="components/Spinner.html" data-type="entity-link" >Spinner</a>
                            </li>
                            <li class="link">
                                <a href="components/SpotlightBg.html" data-type="entity-link" >SpotlightBg</a>
                            </li>
                            <li class="link">
                                <a href="components/StoriesStrip.html" data-type="entity-link" >StoriesStrip</a>
                            </li>
                            <li class="link">
                                <a href="components/StoryViewer.html" data-type="entity-link" >StoryViewer</a>
                            </li>
                            <li class="link">
                                <a href="components/SuggestionsPanel.html" data-type="entity-link" >SuggestionsPanel</a>
                            </li>
                            <li class="link">
                                <a href="components/Title.html" data-type="entity-link" >Title</a>
                            </li>
                            <li class="link">
                                <a href="components/Topbar.html" data-type="entity-link" >Topbar</a>
                            </li>
                            <li class="link">
                                <a href="components/TrendingList.html" data-type="entity-link" >TrendingList</a>
                            </li>
                            <li class="link">
                                <a href="components/VeganConvertModal.html" data-type="entity-link" >VeganConvertModal</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/ClickOutsideDirective.html" data-type="entity-link" >ClickOutsideDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/ImgFallbackDirective.html" data-type="entity-link" >ImgFallbackDirective</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AiRecipeService.html" data-type="entity-link" >AiRecipeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AiRecipeStore.html" data-type="entity-link" >AiRecipeStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthStore.html" data-type="entity-link" >AuthStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CallService.html" data-type="entity-link" >CallService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CallStore.html" data-type="entity-link" >CallStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommentService.html" data-type="entity-link" >CommentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommentStore.html" data-type="entity-link" >CommentStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommentSupabaseRepository.html" data-type="entity-link" >CommentSupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExploreService.html" data-type="entity-link" >ExploreService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExploreStore.html" data-type="entity-link" >ExploreStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeedService.html" data-type="entity-link" >FeedService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeedStore.html" data-type="entity-link" >FeedStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GlobalSearchStore.html" data-type="entity-link" >GlobalSearchStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/IsOnServer.html" data-type="entity-link" >IsOnServer</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MessagesService.html" data-type="entity-link" >MessagesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MessagesStore.html" data-type="entity-link" >MessagesStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MessageSupabaseRepository.html" data-type="entity-link" >MessageSupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationsService.html" data-type="entity-link" >NotificationsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationsStore.html" data-type="entity-link" >NotificationsStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationSupabaseRepository.html" data-type="entity-link" >NotificationSupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlacesService.html" data-type="entity-link" >PlacesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlacesStore.html" data-type="entity-link" >PlacesStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PostActionsService.html" data-type="entity-link" >PostActionsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PostGraphqlRepository.html" data-type="entity-link" >PostGraphqlRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PostMediaService.html" data-type="entity-link" >PostMediaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PostMediaSupabaseRepository.html" data-type="entity-link" >PostMediaSupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PreferencesService.html" data-type="entity-link" >PreferencesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PresenceService.html" data-type="entity-link" >PresenceService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfileGraphqlRepository.html" data-type="entity-link" >ProfileGraphqlRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfileService.html" data-type="entity-link" >ProfileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportsService.html" data-type="entity-link" >ReportsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportSupabaseRepository.html" data-type="entity-link" >ReportSupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SearchHybridRepository.html" data-type="entity-link" >SearchHybridRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SearchService.html" data-type="entity-link" >SearchService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SettingsGraphqlRepository.html" data-type="entity-link" >SettingsGraphqlRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SettingsService.html" data-type="entity-link" >SettingsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ShoppingListService.html" data-type="entity-link" >ShoppingListService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StoriesService.html" data-type="entity-link" >StoriesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StoriesStore.html" data-type="entity-link" >StoriesStore</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorySupabaseRepository.html" data-type="entity-link" >StorySupabaseRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SupabaseService.html" data-type="entity-link" >SupabaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThemeService.html" data-type="entity-link" >ThemeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ToastService.html" data-type="entity-link" >ToastService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TranslationService.html" data-type="entity-link" >TranslationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserGraphqlRepository.html" data-type="entity-link" >UserGraphqlRepository</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AiIdea.html" data-type="entity-link" >AiIdea</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AiRecipeRequest.html" data-type="entity-link" >AiRecipeRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AiRecipeResult.html" data-type="entity-link" >AiRecipeResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Allergen.html" data-type="entity-link" >Allergen</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BaseEntity.html" data-type="entity-link" >BaseEntity</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CallSignalPayload.html" data-type="entity-link" >CallSignalPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CallState.html" data-type="entity-link" >CallState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChatMessage.html" data-type="entity-link" >ChatMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CloudflareEnv.html" data-type="entity-link" >CloudflareEnv</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Collection.html" data-type="entity-link" >Collection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Comment.html" data-type="entity-link" >Comment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommentCountChanged.html" data-type="entity-link" >CommentCountChanged</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommentDto.html" data-type="entity-link" >CommentDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommentPage.html" data-type="entity-link" >CommentPage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Contact.html" data-type="entity-link" >Contact</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Conversation.html" data-type="entity-link" >Conversation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Conversation-1.html" data-type="entity-link" >Conversation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConversationRow.html" data-type="entity-link" >ConversationRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreatePostInput.html" data-type="entity-link" >CreatePostInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreatePostRecipeInput.html" data-type="entity-link" >CreatePostRecipeInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateUserPayload.html" data-type="entity-link" >CreateUserPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DirectMessage.html" data-type="entity-link" >DirectMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DirectPostRow.html" data-type="entity-link" >DirectPostRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Environment.html" data-type="entity-link" >Environment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExploreCategoryTab.html" data-type="entity-link" >ExploreCategoryTab</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExplorePage.html" data-type="entity-link" >ExplorePage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeaturedChef.html" data-type="entity-link" >FeaturedChef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeedPage.html" data-type="entity-link" >FeedPage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FollowChanged.html" data-type="entity-link" >FollowChanged</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FollowListUser.html" data-type="entity-link" >FollowListUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlFollowUser.html" data-type="entity-link" >GqlFollowUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlPostNode.html" data-type="entity-link" >GqlPostNode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlSearchUser.html" data-type="entity-link" >GqlSearchUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlUpdateProfileResult.html" data-type="entity-link" >GqlUpdateProfileResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlUser.html" data-type="entity-link" >GqlUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GqlUserSettings.html" data-type="entity-link" >GqlUserSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBaseRepository.html" data-type="entity-link" >IBaseRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICommentRepository.html" data-type="entity-link" >ICommentRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IMessageRepository.html" data-type="entity-link" >IMessageRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ingredient.html" data-type="entity-link" >Ingredient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IngredientRow.html" data-type="entity-link" >IngredientRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/INotificationRepository.html" data-type="entity-link" >INotificationRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InteractionOverride.html" data-type="entity-link" >InteractionOverride</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IPostMediaRepository.html" data-type="entity-link" >IPostMediaRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IPostRepository.html" data-type="entity-link" >IPostRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IProfileRepository.html" data-type="entity-link" >IProfileRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IReportRepository.html" data-type="entity-link" >IReportRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISearchRepository.html" data-type="entity-link" >ISearchRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISettingsRepository.html" data-type="entity-link" >ISettingsRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IStoryRepository.html" data-type="entity-link" >IStoryRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserRepository.html" data-type="entity-link" >IUserRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikeChanged.html" data-type="entity-link" >LikeChanged</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikeResult.html" data-type="entity-link" >LikeResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikeResultDto.html" data-type="entity-link" >LikeResultDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginUser.html" data-type="entity-link" >LoginUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageDateGroup.html" data-type="entity-link" >MessageDateGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageReply.html" data-type="entity-link" >MessageReply</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageRow.html" data-type="entity-link" >MessageRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessagesPageResult.html" data-type="entity-link" >MessagesPageResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageUser.html" data-type="entity-link" >MessageUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Notification.html" data-type="entity-link" >Notification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationActor.html" data-type="entity-link" >NotificationActor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationGroup.html" data-type="entity-link" >NotificationGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PageInfoDto.html" data-type="entity-link" >PageInfoDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Place.html" data-type="entity-link" >Place</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceReview.html" data-type="entity-link" >PlaceReview</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceWithDistance.html" data-type="entity-link" >PlaceWithDistance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceWithDistance-1.html" data-type="entity-link" >PlaceWithDistance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Post.html" data-type="entity-link" >Post</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostAuthor.html" data-type="entity-link" >PostAuthor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostAuthorDto.html" data-type="entity-link" >PostAuthorDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostConnectionDto.html" data-type="entity-link" >PostConnectionDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostDto.html" data-type="entity-link" >PostDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostEdgeDto.html" data-type="entity-link" >PostEdgeDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostMedia.html" data-type="entity-link" >PostMedia</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PostMediaDto.html" data-type="entity-link" >PostMediaDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Preference.html" data-type="entity-link" >Preference</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PublicUser.html" data-type="entity-link" >PublicUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RawNotificationRow.html" data-type="entity-link" >RawNotificationRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RawPlace.html" data-type="entity-link" >RawPlace</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RawPlaceWithDistance.html" data-type="entity-link" >RawPlaceWithDistance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RawReview.html" data-type="entity-link" >RawReview</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecentAiRecipe.html" data-type="entity-link" >RecentAiRecipe</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Recipe.html" data-type="entity-link" >Recipe</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Recipe-1.html" data-type="entity-link" >Recipe</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeAttachment.html" data-type="entity-link" >RecipeAttachment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeDto.html" data-type="entity-link" >RecipeDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeIngredient.html" data-type="entity-link" >RecipeIngredient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeIngredient-1.html" data-type="entity-link" >RecipeIngredient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeStep.html" data-type="entity-link" >RecipeStep</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeStep-1.html" data-type="entity-link" >RecipeStep</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecipeTypeOption.html" data-type="entity-link" >RecipeTypeOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterUser.html" data-type="entity-link" >RegisterUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportCategoryOption.html" data-type="entity-link" >ReportCategoryOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResolvedProfile.html" data-type="entity-link" >ResolvedProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RespondFollowRequestResult.html" data-type="entity-link" >RespondFollowRequestResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReviewWithUser.html" data-type="entity-link" >ReviewWithUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SaveChanged.html" data-type="entity-link" >SaveChanged</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedCollection.html" data-type="entity-link" >SavedCollection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedPost.html" data-type="entity-link" >SavedPost</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedPostDto.html" data-type="entity-link" >SavedPostDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedPostsResult.html" data-type="entity-link" >SavedPostsResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedRecipe.html" data-type="entity-link" >SavedRecipe</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SbCommentRow.html" data-type="entity-link" >SbCommentRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchPost.html" data-type="entity-link" >SearchPost</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchPostRow.html" data-type="entity-link" >SearchPostRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchUser.html" data-type="entity-link" >SearchUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SettingsToggle.html" data-type="entity-link" >SettingsToggle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShareableProfile.html" data-type="entity-link" >ShareableProfile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SharedPostPreview.html" data-type="entity-link" >SharedPostPreview</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShellNavItem.html" data-type="entity-link" >ShellNavItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShoppingGroup.html" data-type="entity-link" >ShoppingGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ShoppingItem.html" data-type="entity-link" >ShoppingItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoreOption.html" data-type="entity-link" >StoreOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoryGroup.html" data-type="entity-link" >StoryGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoryItem.html" data-type="entity-link" >StoryItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoryRow.html" data-type="entity-link" >StoryRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StoryUserRow.html" data-type="entity-link" >StoryUserRow</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SuggestedUser.html" data-type="entity-link" >SuggestedUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Tab.html" data-type="entity-link" >Tab</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TagChip.html" data-type="entity-link" >TagChip</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TimestampedEntity.html" data-type="entity-link" >TimestampedEntity</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToggleFollowResult.html" data-type="entity-link" >ToggleFollowResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToggleLikeResult.html" data-type="entity-link" >ToggleLikeResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToggleResult.html" data-type="entity-link" >ToggleResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToggleSaveResult.html" data-type="entity-link" >ToggleSaveResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Trend.html" data-type="entity-link" >Trend</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Trend-1.html" data-type="entity-link" >Trend</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeTab.html" data-type="entity-link" >TypeTab</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdatePersonProfileInput.html" data-type="entity-link" >UpdatePersonProfileInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User-1.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserAllergy.html" data-type="entity-link" >UserAllergy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserDto.html" data-type="entity-link" >UserDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPostsPage.html" data-type="entity-link" >UserPostsPage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPreference.html" data-type="entity-link" >UserPreference</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPresenceState.html" data-type="entity-link" >UserPresenceState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserSettings.html" data-type="entity-link" >UserSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VeganIngredientResult.html" data-type="entity-link" >VeganIngredientResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VeganRecipeResult.html" data-type="entity-link" >VeganRecipeResult</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/MessageMarkdownPipe.html" data-type="entity-link" >MessageMarkdownPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/TimeAgoPipe.html" data-type="entity-link" >TimeAgoPipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/TranslatePipe.html" data-type="entity-link" >TranslatePipe</a>
                                </li>
                                <li class="link">
                                    <a href="pipes/TruncateTextPipe.html" data-type="entity-link" >TruncateTextPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});