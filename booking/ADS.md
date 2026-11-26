# Facebook & Instagram ads for Magic Massage

These ads show up while people scroll their Facebook and Instagram feeds around Rockhampton. Tapping **Book now** opens the booking site.

> **Before you spend anything:** the booking site must be **online** and **connected to the Google Sheet** (SETUP.md steps 2 and 3). Otherwise people who tap the ad land on a page in preview mode, and their bookings aren't saved.

## You need
- The shop's **Facebook Page** (Instagram linked to it is a bonus).
- A card added to Meta for paying for ads.
- The booking site's web address (written as `YOUR-SITE` below).

## The pictures (in `booking/ads/`)

| File | Use it for |
|---|---|
| `ad-menu-1080x1350.png` | Feed. Shows prices, which usually gets the most taps |
| `ad-thursday-1080x1350.png` | Feed. The late-night Thursday angle |
| `ad-square-1080x1080.png` | Feed, if you only want one picture |
| `ad-story-1080x1920.png` | Stories and Reels (full screen) |

Real photos of your treatment room usually beat designed pictures. If you have a nice one, send it and I'll make it into an ad too.

## Ad text (copy and paste)

**Ad 1: prices** (with `ad-menu` and `ad-story`)
- Primary text:
  > Treat yourself this week 💆 Massage, acupuncture and cupping at Stockland Rockhampton, next to Bright Eyes. Neck & shoulder from $65, whole body massage $105. HICAPS health fund claiming on the spot. See the free times and book online in under a minute 👇
- Headline: `Book a massage in under a minute`
- Description: `Stockland Rockhampton · HICAPS available`
- Button: **Book now**
- Link: `https://YOUR-SITE/?utm_source=facebook&utm_campaign=prices&utm_content=menu`

**Ad 2: Thursday late nights** (with `ad-thursday`)
- Primary text:
  > Open till 9pm every Thursday 🌙 Book an after-work massage at Magic Massage, Stockland Rockhampton. Whole body, hot stone, sports and pregnancy massage, plus acupuncture and cupping. HICAPS available. Pick your time online 👇
- Headline: `Late-night massage, Thursdays till 9pm`
- Button: **Book now**
- Link: `https://YOUR-SITE/?utm_source=facebook&utm_campaign=thursday&utm_content=late-night`

**Ad 3: whole body** (with `ad-square`). The link opens straight on the time picker:
- Primary text:
  > An hour of calm at Stockland Rockhampton ✨ Whole body massage, 60 minutes, $105. Choose relaxing or firm pressure. Book your time online and claim on HICAPS when you visit 👇
- Headline: `Whole body massage, 60 min $105`
- Button: **Book now**
- Link: `https://YOUR-SITE/?service=whole-body-60&utm_source=facebook&utm_campaign=whole-body`

Meta rejects ads that guess at someone's health ("Do *you* have back pain?"), so the text above doesn't do that. Keep it that way if you change it.

## Easy way: Boost a post (10 min)
1. On the Magic Massage Facebook Page, make a post with **one picture** and the **primary text** from above.
2. Press **Boost post**.
3. Goal: **Get more website visitors**. Button: **Book now**. Website: your link from above.
4. Audience: **People you choose through targeting** › Location **Rockhampton, Queensland + 25 km**. Add **Yeppoon** if you want the coast. Age **18–65+**.
5. Budget: **$10 a day for 7 days** to start.
6. Tick **Instagram** too if it's linked. Press **Boost**. Meta checks the ad, usually within a day.

## Better way: Ads Manager (20 min)
Ads Manager lets you run all three ads at once, and Meta shows more of whichever one gets bookings.

1. Go to **adsmanager.facebook.com** › **Create**.
2. Campaign objective: **Traffic**. Turn on **Advantage campaign budget**: **$10–15 a day**.
3. Ad set:
   - Conversion location: **Website**. Performance goal: **Maximise landing page views**.
   - Location: **Rockhampton QLD + 25 km**. Age **18–65+**. Leave **Advantage+ audience** on.
   - Placements: **Advantage+ placements** (Facebook and Instagram feeds, Stories, Reels).
4. Ads: make **one ad for each of Ads 1–3**. For each one, choose **Single image**, upload the 1080×1350 picture, and use the 1080×1920 one for Stories/Reels where it asks. Then paste in the text, headline, button and link.
5. **Publish**.

Once the Meta Pixel ID is in `index.html` and you've had about 10–20 bookings from ads, change the campaign to the **Sales** objective, optimising for the **Schedule** event. Meta then looks for people who actually book, not just people who click.

## Checking what's working
- **Bookings sheet**: the **Source / Campaign / Ad** columns show which ad brought each booking (e.g. `facebook / thursday / late-night`).
- **Ads Manager**: compare **cost per landing page view** and, once the Pixel is on, **cost per Schedule**.
- After a week, pause the weakest ad and move its money to the best one.
