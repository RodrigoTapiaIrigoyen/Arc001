# Raider Profile System - Testing Guide

## Test Scenario 1: Creating a Raider Profile

### Steps:

1. Log in to the application
2. Navigate to "Raider Profile" (Crown icon)
3. Fill in the profile information:
   - Equipment: Choose light/heavy/mixed
   - Strategy: Choose aggressive/passive/extraction
   - Company: Choose solo/duo/trio
   - Description: Enter playstyle notes
4. Click "Save Profile"

### Expected Results:

- ✅ Profile is created successfully
- ✅ Raider type is auto-generated (e.g., "🐀 Rata Rápida")
- ✅ Community stats initialized to 0
- ✅ Profile appears in Raider Hub leaderboard

---

## Test Scenario 2: Create a Community Post (posts_shared)

### Prerequisites:

- Must have a raider profile created
- Must be logged in

### Steps:

1. Navigate to Community Hub
2. Click "New Post"
3. Fill in:
   - Title: "Test Post"
   - Content: "This is a test post"
   - Category: Select any category
4. Click "Share"

### Expected Results:

- ✅ Post is created successfully
- ✅ `posts_shared` stat increments by 1
- ✅ Can verify by checking Raider Profile (stats updated)
- ✅ Can verify by checking Raider Hub leaderboard (ranking may change)

### Verification Command (cURL):

```bash
# Get user stats
curl http://localhost:5000/api/raider-profiles/{userId}/statistics \
  -H "Authorization: Bearer {token}"
```

---

## Test Scenario 3: Accept Friend Request (friends_count)

### Prerequisites:

- Have 2 accounts logged in (User A and User B)
- Both have raider profiles

### Steps:

1. Log in as User A
2. Navigate to Friends
3. Search for User B
4. Click "Send Friend Request"
5. Log in as User B
6. Navigate to Friends → "Pending Requests"
7. Click "Accept"

### Expected Results:

- ✅ Friendship accepted
- ✅ User A's `friends_count` increments by 1
- ✅ User B's `friends_count` increments by 1
- ✅ Both users appear in each other's friends list

### Verification:

```bash
# Get both users' stats
curl http://localhost:5000/api/raider-profiles/{userA_id}/statistics \
  -H "Authorization: Bearer {tokenA}"

curl http://localhost:5000/api/raider-profiles/{userB_id}/statistics \
  -H "Authorization: Bearer {tokenB}"
```

---

## Test Scenario 4: Create a Group (groups_created)

### Prerequisites:

- Must have a raider profile created
- Must be logged in

### Steps:

1. Navigate to Grupos (Groups)
2. Click "Create Group" or similar button
3. Fill in:
   - Title: "Test Raid Squad"
   - Description: "Testing group creation"
   - Type: Select any type
4. Click "Create"

### Expected Results:

- ✅ Group is created successfully
- ✅ `groups_created` stat increments by 1
- ✅ User is listed as owner
- ✅ Stat updates reflected in Raider Profile

---

## Test Scenario 5: Upvote Post (community_reputation)

### Prerequisites:

- User A has created a post in Community Hub
- User B is logged in with a raider profile

### Steps:

1. Log in as User B
2. Navigate to Community Hub
3. Find User A's post
4. Click the upvote button (thumbs up icon)

### Expected Results:

- ✅ Vote is registered (upvote count increases)
- ✅ User A's `community_reputation` increments by 1
- ✅ Can verify in User A's Raider Profile stats
- ✅ User A's position in Raider Hub leaderboard may improve

### Verification:

```bash
# Check reputation before upvote
curl http://localhost:5000/api/raider-profiles/{userA_id}/statistics \
  -H "Authorization: Bearer {tokenA}"

# Upvote the post (as User B)
curl -X POST http://localhost:5000/api/community/posts/{postId}/vote \
  -H "Authorization: Bearer {tokenB}" \
  -H "Content-Type: application/json" \
  -d '{"vote": "up"}'

# Check reputation after upvote (should be +1)
curl http://localhost:5000/api/raider-profiles/{userA_id}/statistics \
  -H "Authorization: Bearer {tokenA}"
```

---

## Test Scenario 6: Upvote Comment (community_reputation)

### Prerequisites:

- User A has commented on a post
- User B is logged in

### Steps:

1. Log in as User B
2. Navigate to Community Hub
3. Find a post with User A's comment
4. Click upvote on User A's comment

### Expected Results:

- ✅ Comment vote is registered
- ✅ User A's `community_reputation` increments by 1
- ✅ Stats updated in real-time

### Verification:

```bash
curl -X POST http://localhost:5000/api/community/comments/{commentId}/vote \
  -H "Authorization: Bearer {tokenB}" \
  -H "Content-Type: application/json" \
  -d '{"vote": "up"}'
```

---

## Test Scenario 7: Check Raider Hub Leaderboard

### Steps:

1. Navigate to "Raider Hub" (⚡ Zap icon)
2. Observe leaderboard sorted by Reputation (default)
3. Try sorting by:
   - Posts Shared (💬)
   - Friends Count (👫)
   - Reputation (⭐)
4. Filter by raider type
5. Search for username

### Expected Results:

- ✅ Leaderboard displays correctly
- ✅ Sorting changes order correctly
- ✅ Filters work properly
- ✅ Search finds users by name/type
- ✅ Stats show correct values
- ✅ Top 3 positions have ranking badges (🥇🥈🥉)

### Verification API Call:

```bash
# Get top 50 raiders by reputation
curl "http://localhost:5000/api/raider-profiles/leaderboard/top?limit=50&sortBy=community_reputation"

# Get top by posts
curl "http://localhost:5000/api/raider-profiles/leaderboard/top?limit=50&sortBy=posts_shared"

# Get specific type
curl "http://localhost:5000/api/raider-profiles/type/Rata%20Rápida"

# Search
curl "http://localhost:5000/api/raider-profiles/search/username"
```

---

## Test Scenario 8: Downvote Does NOT Increase Reputation

### Prerequisites:

- User A has created a post

### Steps:

1. Log in as User B
2. Navigate to Community Hub
3. Find User A's post
4. Click the downvote button (thumbs down)

### Expected Results:

- ✅ Downvote is registered
- ✅ User A's `community_reputation` does NOT change (negative votes don't penalize)
- ✅ Downvote count increments
- ✅ Upvote count remains unchanged

---

## Test Scenario 9: Days in Community Calculation

### Prerequisites:

- Any user with raider profile

### Steps:

1. Check user's Raider Profile
2. Look at "Days in Community" stat

### Expected Results:

- ✅ Shows correct number of days since registration
- ✅ Increments by 1 each day
- ✅ Calculated from created_at timestamp
- ✅ No manual updates needed

### Calculation:

```
days = floor((now - profile.created_at) / (1000 * 60 * 60 * 24))
```

---

## Testing Checklist

### Core Stats Tracking:

- [ ] posts_shared increments on post creation
- [ ] friends_count increments on friendship acceptance (both users)
- [ ] groups_created increments on group creation
- [ ] community_reputation increments on upvotes (posts)
- [ ] community_reputation increments on upvotes (comments)
- [ ] community_reputation does NOT increment on downvotes
- [ ] days_in_community calculates correctly

### UI/Display:

- [ ] Raider Profile shows all stats correctly
- [ ] Raider Hub displays stats in leaderboard
- [ ] Sorting by all metrics works
- [ ] Filtering by raider type works
- [ ] Search functionality works
- [ ] Mobile view displays stats properly
- [ ] Desktop view displays stats properly

### Error Handling:

- [ ] System handles missing raider profiles gracefully
- [ ] System handles invalid votes
- [ ] System handles concurrent updates
- [ ] Stats don't double-increment

### Performance:

- [ ] Leaderboard loads in < 1 second
- [ ] Search completes in < 500ms
- [ ] Stats updates don't block UI
- [ ] No memory leaks on repeated actions

---

## Troubleshooting Common Issues

### Stats Not Updating:

1. Check browser console for errors
2. Verify raider profile exists: `GET /api/raider-profiles/{userId}`
3. Check MongoDB collections exist
4. Review server logs for error messages
5. Ensure authentication token is valid

### Profile Not Found Error:

```bash
# Create profile if missing
curl -X POST http://localhost:5000/api/raider-profiles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment": "light",
    "strategy": "aggressive",
    "company": "solo",
    "raider_type": "Rata Rápida",
    "raider_emoji": "🐀",
    "raider_description": "Test profile"
  }'
```

### Leaderboard Not Showing Users:

1. Verify profiles are created
2. Check sorting parameter is valid
3. Verify limit parameter is reasonable
4. Check database for raider_profiles collection

---

## Performance Benchmarks

### Target Response Times:

- Profile creation: < 500ms
- Get single profile: < 200ms
- Get leaderboard (50 items): < 300ms
- Update stats: < 200ms
- Search: < 400ms

### Load Testing:

- Test with 100+ concurrent users
- Test with 10,000+ profiles in leaderboard
- Monitor database query times
- Monitor memory usage

---

## Notes:

- All timestamps are in UTC
- Stats are stored in MongoDB (raider_profiles collection)
- Changes are saved to database immediately
- Frontend stats should refresh automatically via API calls
- No cached data - always fresh from DB
