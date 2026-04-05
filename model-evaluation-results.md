# Model Evaluation Results

**Date:** 2026-04-05
**Test set:** 20 synthetic emails (16 should-rewrite, 4 should-not)

## Summary

| Model | Accuracy | Correct / 20 | Avg Latency (s) | Avg Decode (tok/s) |
|-------|----------|-------------|-----------------|-------------------|
| SmolLM2-360M | 20% | 4 / 20 | 0.13 | 72.7 |
| SmolLM2-1.7B | 35% | 7 / 20 | 0.17 | 106.1 |
| Qwen2.5-1.5B | 20% | 4 / 20 | 0.15 | 85.1 |
| Gemma-2-2B | 80% | 16 / 20 | 0.26 | 65.1 |
| Phi-3.5-mini (3.8B) | 90% | 18 / 20 | 0.47 | 57.3 |

## SmolLM2-360M

| # | Category | Expected | Predicted | Result | Latency (s) |
|---|----------|----------|-----------|--------|-------------|
| 1 | apology-heavy | YES | NO | ✗ | 0.18 |
| 2 | apology-heavy | YES | NO | ✗ | 0.17 |
| 3 | apology-heavy | YES | NO | ✗ | 0.17 |
| 4 | apology-heavy | YES | NO | ✗ | 0.08 |
| 5 | apology-heavy | YES | NO | ✗ | 0.06 |
| 6 | late-reply | YES | NO | ✗ | 0.14 |
| 7 | late-reply | YES | NO | ✗ | 0.12 |
| 8 | late-reply | YES | NO | ✗ | 0.17 |
| 9 | late-reply | YES | NO | ✗ | 0.16 |
| 10 | verbose | YES | NO | ✗ | 0.12 |
| 11 | verbose | YES | NO | ✗ | 0.11 |
| 12 | verbose | YES | NO | ✗ | 0.10 |
| 13 | verbose | YES | NO | ✗ | 0.09 |
| 14 | concise | NO | NO | ✓ | 0.11 |
| 15 | concise | NO | NO | ✓ | 0.07 |
| 16 | concise | NO | NO | ✓ | 0.09 |
| 17 | concise | NO | NO | ✓ | 0.16 |
| 18 | mixed | YES | NO | ✗ | 0.20 |
| 19 | mixed | YES | NO | ✗ | 0.10 |
| 20 | mixed | YES | NO | ✗ | 0.20 |

### Rewrite Samples

**Email #2 (apology-heavy)** — 4.1s

Original:
```
Subject: Re: Design feedback
Sorry sorry sorry! I know I promised to review this last week and I completely dropped the ball. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

Rewritten:
```
Subject: Re: Design feedback
Content:
I apologize for the delay in my response. I understand your frustration with the design and I would like to address it. I would like to suggest a few minor adjustments to the header and CTA button. Please let me know if you have any questions or concerns.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't hesitate to let me know if you need any further assistance.

I apologize again for the delay. Please don't any further assistance.

I apologize
```

**Email #10 (verbose)** — 1.6s

Original:
```
Subject: Re: Access to staging environment
Hi! So I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically the staging-west cluster. If you could grant me read access that would be wonderful and I would really appreciate it. Thank you so much for your help with this!
```

Rewritten:
```
Subject: Re: Re: Access to Staging Environment
Content:
Hi!
I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically, I would really appreciate it if you could grant me read access to the staging-west cluster. Thank you so much for your help with this!
```

**Email #18 (mixed)** — 1.6s

Original:
```
Subject: Re: API integration timeline
I'm really sorry for the delay on this — I know you've been waiting. So basically what happened is that I was looking into the API docs and I realized that the authentication flow is more complex than we initially thought, which is why I wanted to take some extra time to really understand it before responding. Anyway, the bottom line is: we can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the wait.
```

Rewritten:
```
Subject: API Integration Timeline
Content:
I apologize for the delay and I understand that the API integration timeline is now more complex. I've been reviewing the API documentation and I've found that the authentication flow is more intricate than initially thought. To ensure a smooth integration process, I recommend that we complete the necessary steps by March 15. We will need to implement OAuth2 with PKCE, which will add approximately 3 days to the original estimate. I'll provide a detailed breakdown to you tomorrow. I apologize again for the delay.
```


## SmolLM2-1.7B

| # | Category | Expected | Predicted | Result | Latency (s) |
|---|----------|----------|-----------|--------|-------------|
| 1 | apology-heavy | YES | NO | ✗ | 0.18 |
| 2 | apology-heavy | YES | NO | ✗ | 0.16 |
| 3 | apology-heavy | YES | NO | ✗ | 0.16 |
| 4 | apology-heavy | YES | YES | ✓ | 0.17 |
| 5 | apology-heavy | YES | NO | ✗ | 0.16 |
| 6 | late-reply | YES | YES | ✓ | 0.17 |
| 7 | late-reply | YES | YES | ✓ | 0.18 |
| 8 | late-reply | YES | NO | ✗ | 0.16 |
| 9 | late-reply | YES | NO | ✗ | 0.16 |
| 10 | verbose | YES | NO | ✗ | 0.19 |
| 11 | verbose | YES | NO | ✗ | 0.21 |
| 12 | verbose | YES | NO | ✗ | 0.21 |
| 13 | verbose | YES | YES | ✓ | 0.20 |
| 14 | concise | NO | NO | ✓ | 0.13 |
| 15 | concise | NO | YES | ✗ | 0.14 |
| 16 | concise | NO | NO | ✓ | 0.13 |
| 17 | concise | NO | NO | ✓ | 0.13 |
| 18 | mixed | YES | NO | ✗ | 0.21 |
| 19 | mixed | YES | NO | ✗ | 0.21 |
| 20 | mixed | YES | NO | ✗ | 0.21 |

### Rewrite Samples

**Email #2 (apology-heavy)** — 0.9s

Original:
```
Subject: Re: Design feedback
Sorry sorry sorry! I know I promised to review this last week and I completely dropped the ball. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

Rewritten:
```
Subject: Re: Design Feedback
Content: I'm sorry for the delay in my review. I completely dropped the ball on this last week. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

**Email #10 (verbose)** — 0.9s

Original:
```
Subject: Re: Access to staging environment
Hi! So I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically the staging-west cluster. If you could grant me read access that would be wonderful and I would really appreciate it. Thank you so much for your help with this!
```

Rewritten:
```
Subject: Re: Access to Staging Environment
Content: Hi! I wanted to reach out regarding this matter. After considering various options and discussing with the team, I believe I need access to the staging-west cluster. If possible, could you grant me read access? Your assistance would be greatly appreciated. Thank you!
```

**Email #18 (mixed)** — 0.8s

Original:
```
Subject: Re: API integration timeline
I'm really sorry for the delay on this — I know you've been waiting. So basically what happened is that I was looking into the API docs and I realized that the authentication flow is more complex than we initially thought, which is why I wanted to take some extra time to really understand it before responding. Anyway, the bottom line is: we can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the wait.
```

Rewritten:
```
Subject: API Integration Timeline

Content: We can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the delay.
```


## Qwen2.5-1.5B

| # | Category | Expected | Predicted | Result | Latency (s) |
|---|----------|----------|-----------|--------|-------------|
| 1 | apology-heavy | YES | NO | ✗ | 0.17 |
| 2 | apology-heavy | YES | NO | ✗ | 0.15 |
| 3 | apology-heavy | YES | NO | ✗ | 0.14 |
| 4 | apology-heavy | YES | NO | ✗ | 0.14 |
| 5 | apology-heavy | YES | NO | ✗ | 0.14 |
| 6 | late-reply | YES | NO | ✗ | 0.14 |
| 7 | late-reply | YES | NO | ✗ | 0.14 |
| 8 | late-reply | YES | NO | ✗ | 0.14 |
| 9 | late-reply | YES | NO | ✗ | 0.14 |
| 10 | verbose | YES | NO | ✗ | 0.17 |
| 11 | verbose | YES | NO | ✗ | 0.17 |
| 12 | verbose | YES | NO | ✗ | 0.19 |
| 13 | verbose | YES | NO | ✗ | 0.17 |
| 14 | concise | NO | NO | ✓ | 0.09 |
| 15 | concise | NO | NO | ✓ | 0.12 |
| 16 | concise | NO | NO | ✓ | 0.12 |
| 17 | concise | NO | NO | ✓ | 0.12 |
| 18 | mixed | YES | NO | ✗ | 0.19 |
| 19 | mixed | YES | NO | ✗ | 0.19 |
| 20 | mixed | YES | NO | ✗ | 0.19 |

### Rewrite Samples

**Email #2 (apology-heavy)** — 0.7s

Original:
```
Subject: Re: Design feedback
Sorry sorry sorry! I know I promised to review this last week and I completely dropped the ball. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

Rewritten:
```
Subject: Design Feedback
Content: I apologize for the delay. The header looks great, but the CTA button font size should be increased to 16px. Thank you for your understanding and patience.
```

**Email #10 (verbose)** — 1.0s

Original:
```
Subject: Re: Access to staging environment
Hi! So I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically the staging-west cluster. If you could grant me read access that would be wonderful and I would really appreciate it. Thank you so much for your help with this!
```

Rewritten:
```
Subject: Access to Staging Environment
Content: I'm reaching out regarding access to the staging environment. After considering various options and consulting with team members, it seems that read-only access to the staging-west cluster is necessary for my project. Could you please provide me with this access? Thank you!
```

**Email #18 (mixed)** — 1.2s

Original:
```
Subject: Re: API integration timeline
I'm really sorry for the delay on this — I know you've been waiting. So basically what happened is that I was looking into the API docs and I realized that the authentication flow is more complex than we initially thought, which is why I wanted to take some extra time to really understand it before responding. Anyway, the bottom line is: we can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the wait.
```

Rewritten:
```
Subject: API integration timeline update
Content: I apologize for the delay. After reviewing the authentication flow, it turned out to be more complex than initially thought. This has led to an additional 3 days required for implementation (OAuth2 with PKCE). The integration will be ready by March 15. Please let me know if you have any further questions or concerns.
```


## Gemma-2-2B

| # | Category | Expected | Predicted | Result | Latency (s) |
|---|----------|----------|-----------|--------|-------------|
| 1 | apology-heavy | YES | YES | ✓ | 0.32 |
| 2 | apology-heavy | YES | YES | ✓ | 0.24 |
| 3 | apology-heavy | YES | YES | ✓ | 0.24 |
| 4 | apology-heavy | YES | YES | ✓ | 0.24 |
| 5 | apology-heavy | YES | YES | ✓ | 0.24 |
| 6 | late-reply | YES | YES | ✓ | 0.24 |
| 7 | late-reply | YES | YES | ✓ | 0.24 |
| 8 | late-reply | YES | YES | ✓ | 0.24 |
| 9 | late-reply | YES | YES | ✓ | 0.24 |
| 10 | verbose | YES | YES | ✓ | 0.28 |
| 11 | verbose | YES | YES | ✓ | 0.28 |
| 12 | verbose | YES | YES | ✓ | 0.32 |
| 13 | verbose | YES | YES | ✓ | 0.28 |
| 14 | concise | NO | YES | ✗ | 0.17 |
| 15 | concise | NO | YES | ✗ | 0.20 |
| 16 | concise | NO | YES | ✗ | 0.20 |
| 17 | concise | NO | YES | ✗ | 0.20 |
| 18 | mixed | YES | YES | ✓ | 0.32 |
| 19 | mixed | YES | YES | ✓ | 0.36 |
| 20 | mixed | YES | YES | ✓ | 0.28 |

### Rewrite Samples

**Email #2 (apology-heavy)** — 0.6s

Original:
```
Subject: Re: Design feedback
Sorry sorry sorry! I know I promised to review this last week and I completely dropped the ball. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

Rewritten:
```
Subject: Design Feedback

Content: The header looks great. I suggest bumping the CTA button font size to 16px.
```

**Email #10 (verbose)** — 0.9s

Original:
```
Subject: Re: Access to staging environment
Hi! So I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically the staging-west cluster. If you could grant me read access that would be wonderful and I would really appreciate it. Thank you so much for your help with this!
```

Rewritten:
```
Subject: Staging Environment Access Request

Content: I would like to request read access to the staging-west cluster for the staging environment. Please let me know if you have any questions.
```

**Email #18 (mixed)** — 1.1s

Original:
```
Subject: Re: API integration timeline
I'm really sorry for the delay on this — I know you've been waiting. So basically what happened is that I was looking into the API docs and I realized that the authentication flow is more complex than we initially thought, which is why I wanted to take some extra time to really understand it before responding. Anyway, the bottom line is: we can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the wait.
```

Rewritten:
```
Subject: API Integration Timeline Update

Content: The API integration is now projected to be ready by March 15th. We'll be implementing OAuth2 with PKCE to ensure a secure integration. I'll provide a detailed breakdown tomorrow.
```


## Phi-3.5-mini (3.8B)

| # | Category | Expected | Predicted | Result | Latency (s) |
|---|----------|----------|-----------|--------|-------------|
| 1 | apology-heavy | YES | YES | ✓ | 0.44 |
| 2 | apology-heavy | YES | YES | ✓ | 0.42 |
| 3 | apology-heavy | YES | YES | ✓ | 0.42 |
| 4 | apology-heavy | YES | YES | ✓ | 0.42 |
| 5 | apology-heavy | YES | YES | ✓ | 0.41 |
| 6 | late-reply | YES | YES | ✓ | 0.42 |
| 7 | late-reply | YES | YES | ✓ | 0.42 |
| 8 | late-reply | YES | YES | ✓ | 0.36 |
| 9 | late-reply | YES | YES | ✓ | 0.36 |
| 10 | verbose | YES | NO | ✗ | 0.63 |
| 11 | verbose | YES | YES | ✓ | 0.63 |
| 12 | verbose | YES | NO | ✗ | 0.64 |
| 13 | verbose | YES | YES | ✓ | 0.49 |
| 14 | concise | NO | NO | ✓ | 0.43 |
| 15 | concise | NO | NO | ✓ | 0.43 |
| 16 | concise | NO | NO | ✓ | 0.35 |
| 17 | concise | NO | NO | ✓ | 0.49 |
| 18 | mixed | YES | YES | ✓ | 0.49 |
| 19 | mixed | YES | YES | ✓ | 0.50 |
| 20 | mixed | YES | YES | ✓ | 0.64 |

### Rewrite Samples

**Email #2 (apology-heavy)** — 1.3s

Original:
```
Subject: Re: Design feedback
Sorry sorry sorry! I know I promised to review this last week and I completely dropped the ball. I feel awful about it. Please forgive the late response. The header looks great, but I think the font size on the CTA button should be bumped to 16px. Again, so sorry for the wait!
```

Rewritten:
```
Subject: Design Feedback - CTA Button Font Size

Content: I apologize for the delayed feedback. The header design is effective, but I recommend increasing the font size of the CTA button to 16px for better visibility and impact.
```

**Email #10 (verbose)** — 1.6s

Original:
```
Subject: Re: Access to staging environment
Hi! So I wanted to reach out because I was thinking about this and I realized that what I probably need, after considering all the different options and talking to a few people on the team about what might work best given our current setup and the way things are configured, is access to the staging environment. Specifically the staging-west cluster. If you could grant me read access that would be wonderful and I would really appreciate it. Thank you so much for your help with this!
```

Rewritten:
```
Subject: Request for Read Access to Staging-West Cluster

Content: I am seeking read access to the staging-west cluster for my work. Your assistance in granting this access would be greatly appreciated.

Thank you for your time and support.

Best regards,
[Your Name]
```

**Email #18 (mixed)** — 1.6s

Original:
```
Subject: Re: API integration timeline
I'm really sorry for the delay on this — I know you've been waiting. So basically what happened is that I was looking into the API docs and I realized that the authentication flow is more complex than we initially thought, which is why I wanted to take some extra time to really understand it before responding. Anyway, the bottom line is: we can have the integration ready by March 15. We need to implement OAuth2 with PKCE, which adds about 3 days to the original estimate. I'll send a detailed breakdown tomorrow. Sorry again for the wait.
```

Rewritten:
```
Subject: API Integration Update and Revised Timeline

Content: The integration complexity has led to an updated completion date of March 15. The authentication flow requires OAuth2 with PKCE, extending the timeline by approximately 3 days. A detailed breakdown will follow shortly.
```

