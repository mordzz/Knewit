import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AuthorRow } from '@/features/home/components/AuthorRow';
import { MarketAttachment } from '@/features/home/components/MarketAttachment';
import { SocialActionBar } from '@/features/home/components/SocialActionBar';
import { CommentRow } from '@/features/home/components/CommentRow';
import { CommentComposer } from '@/features/home/components/CommentComposer';
import { usePost } from '@/features/home/hooks/usePost';
import { useComments } from '@/features/home/hooks/useComments';
import { useCreateComment } from '@/features/home/hooks/useCreateComment';
import { useDeleteComment } from '@/features/home/hooks/useDeleteComment';
import { useDeletePost } from '@/features/home/hooks/useDeletePost';
import { navigateToMarketDetail } from '@/features/markets/utils/openMarketDetail';
import { ApiRequestError } from '@/services/api/client';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { colors } from '@/theme';
import type { CommentItem, FeedItem, MarketSummary } from '@/types/social';
import type { AppParamList } from '@/types/navigation';

/**
 * A position-backed Callout's detail. The Verified Position block renders
 * via the same `MarketAttachment` component used everywhere else  no
 * separate "Call Detail" market UI. The badge means "verified when
 * created," never "still holds this position"  see docs/DECISIONS.md.
 * The header's "…" deletes the Callout when the viewer authored it
 * (`canDelete`, server-computed).
 */
export function PostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'PostDetail'>>();
  const { postId } = route.params;
  const post = usePost(postId);
  const comments = useComments(postId);
  const createComment = useCreateComment(postId);
  const deleteCommentMutation = useDeleteComment(postId);
  const deletePostMutation = useDeletePost(postId);
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const openAuthor = useCallback(
    (userId: string) => navigation.navigate('Profile', { userId }),
    [navigation]
  );
  const openMarket = useCallback(
    (market: MarketSummary) => navigateToMarketDetail(navigation, market),
    [navigation]
  );

  const isNotFound =
    post.status === 'error' && post.error instanceof ApiRequestError && post.error.status === 404;

  const renderComment = useCallback(
    ({ item }: { item: CommentItem }) => (
      <CommentRow
        comment={item}
        postId={postId}
        onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
        onOpenAuthor={openAuthor}
        onReply={setReplyTarget}
        deletingCommentId={
          deleteCommentMutation.isPending ? (deleteCommentMutation.variables ?? null) : null
        }
      />
    ),
    [deleteCommentMutation, openAuthor, postId]
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Screen className="gap-0 px-0 pt-4" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Icon name="chevron-back" size={24} />
          </Pressable>
          {post.status === 'success' && post.data.canDelete ? (
            <Pressable
              onPress={() => setConfirmDeleteVisible(true)}
              disabled={deletePostMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Call options"
              hitSlop={8}
            >
              <Icon name="ellipsis-horizontal" size={22} color="textTertiary" />
            </Pressable>
          ) : null}
        </View>

        {post.status === 'pending' ? (
          <View className="px-4">
            <LoadingState rows={3} />
          </View>
        ) : null}

        {post.status === 'error' && isNotFound ? (
          <View className="flex-1 px-4">
            <EmptyState
              icon="search"
              title="Callout not found"
              message="This Callout may have been removed or the link is incorrect."
              actionLabel="Go back"
              onAction={() => navigation.goBack()}
            />
          </View>
        ) : null}

        {post.status === 'error' && !isNotFound ? (
          <View className="px-4">
            <ErrorState message="Couldn't load this Callout." onRetry={() => post.refetch()} />
          </View>
        ) : null}

        {post.status === 'success' ? (
          <FlatList
            className="flex-1"
            data={comments.data?.pages.flatMap((page) => page.items) ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListHeaderComponent={
              <PostContent item={post.data} onOpenAuthor={openAuthor} onOpenMarket={openMarket} />
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (comments.hasNextPage && !comments.isFetchingNextPage) {
                comments.fetchNextPage();
              }
            }}
            ListEmptyComponent={
              comments.status === 'pending' ? (
                <View className="px-4">
                  <LoadingState rows={2} />
                </View>
              ) : comments.status === 'error' ? (
                <ErrorState message="Couldn't load comments." onRetry={() => comments.refetch()} />
              ) : (
                <EmptyState
                  icon="chatbubble-outline"
                  title="No comments yet"
                  message="Be the first to share your thoughts."
                />
              )
            }
            ListFooterComponent={
              comments.isFetchingNextPage ? (
                <View className="py-4">
                  <ActivityIndicator color={colors.textSecondary} />
                </View>
              ) : null
            }
          />
        ) : null}

        {post.status === 'success' ? (
          <CommentComposer
            isSubmitting={createComment.isPending}
            replyingToHandle={replyTarget?.author.handle ?? null}
            onCancelReply={() => setReplyTarget(null)}
            onSubmit={(body) => {
              const parentCommentId = replyTarget?.id;
              createComment.mutate(
                { body, parentCommentId },
                { onSuccess: () => setReplyTarget(null) }
              );
            }}
          />
        ) : null}
      </Screen>

      <Modal visible={confirmDeleteVisible} onClose={() => setConfirmDeleteVisible(false)}>
        <View className="gap-3">
          <Text variant="bodyStrong">Delete this Callout?</Text>
          <Text variant="body" color="textSecondary">
            Its comments and likes go too. This action cannot be undone.
          </Text>
          <View className="flex-row gap-2">
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setConfirmDeleteVisible(false)}
              className="flex-1"
            />
            <Button
              label="Delete"
              variant="no"
              loading={deletePostMutation.isPending}
              onPress={() =>
                deletePostMutation.mutate(undefined, { onSuccess: () => navigation.goBack() })
              }
              className="flex-1"
            />
          </View>
          {deletePostMutation.isError ? (
            <Text variant="caption" color="danger">
              Couldn&apos;t delete this Callout. Please try again.
            </Text>
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function PostContent({
  item,
  onOpenAuthor,
  onOpenMarket,
}: {
  item: FeedItem;
  onOpenAuthor: (userId: string) => void;
  onOpenMarket: (market: MarketSummary) => void;
}) {
  return (
    <View className="gap-3 px-4 pb-4">
      <AuthorRow author={item.author} onPress={() => onOpenAuthor(item.author.id)} />

      <Text variant="body">{item.body}</Text>
      <Text variant="caption" color="textTertiary">
        {formatRelativeTime(item.createdAt)}
      </Text>

      {item.market ? (
        <MarketAttachment
          market={item.market}
          positionSnapshot={item.positionSnapshot}
          onPress={() => onOpenMarket(item.market!)}
        />
      ) : null}

      <SocialActionBar
        postId={item.id}
        liked={item.liked}
        likeCount={item.likeCount}
        commentCount={item.commentCount}
        shareMessage={
          item.market
            ? `${item.body}\n\n${item.market.question}  via Knewit`
            : `${item.body}\n\nvia Knewit`
        }
      />

      <View className="mt-2 border-t border-border pt-3">
        <Text variant="bodyStrong">Comments</Text>
      </View>
    </View>
  );
}
