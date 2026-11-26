# Magic Massage booking site: setup

Three files make up the site:

| File | What it is |
|---|---|
| `index.html` | The website customers see. Your shop details are at the top. |
| `apps-script.gs` | The small program that saves bookings into your Google Sheet and emails you. |
| `og.png` | The picture Facebook shows when someone shares your link. |

Until you finish step 2 the site runs in **preview mode**: it works, but bookings only stay in the browser that made them.

---

## 1. Check your shop details (5 min)

Your details are already filled in from magicmassageau.com and the Stockland listing: address, phone, opening hours and the full price list. Please check them, especially:

- **Hot stone massage $175** and **Feet, neck & shoulders $155** are set to **90 minutes**. Your price list picture says "60mins" for both, which looks like a typo. If they really are 60 minutes, change the `90` to `60`.
- **Closed days**: only Christmas Day is in `closedDates`. Add other days the shop is shut, e.g. `"2027-01-01"`.
- **Booking rules**: start times every 15 minutes, a 15-minute gap after each treatment, and nobody can book less than 1 hour ahead. Change `slotStep`, `bufferMinutes` and `minNoticeHours` to suit.

To change anything, open `index.html` and look for the two `EDIT` blocks near the top:

- **EDIT 1**: the shop name and description that Facebook and Google show.
- **EDIT 2** (`window.CONFIG`): your name, phone, address, prices, massages, opening hours, holidays, FAQs.

Keep the quotes and commas as they are. Times are 24-hour (`"09:00"`, `"19:30"`), and `null` means closed that day.

## 2. Connect a Google Sheet so bookings are saved (10 min, free)

1. Go to [sheets.new](https://sheets.new) to make a new Google Sheet. Call it something like "Bookings".
2. **File › Settings**: set the **Time zone** to **(GMT+10:00) Brisbane**, then press Save. (Queensland has no daylight saving, so pick Brisbane, not Sydney.)
3. **Extensions › Apps Script**. Delete everything in the editor and paste in the whole of `apps-script.gs`. The `SETTINGS` block at the top already has your shop name, phone and address.

   Do this while logged in to the Google account you want booking emails sent to (e.g. magicmassagerockhampton@gmail.com), or put that address in `notifyEmail`.
4. Press **Save** (the disk icon). In the function menu next to **Run**, pick `setup` and press **Run**.
   Google asks for permission: **Review permissions** › choose your account › **Advanced** › **Go to (project name)** › **Allow**.
   It warns you because you wrote the script yourself and Google hasn't checked it. That's normal.
5. **Deploy › New deployment**. Click the gear › **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Paste that URL into `index.html` as `bookingApiUrl: "https://script.google.com/macros/s/.../exec",`

To test it, open the URL in your browser. It should say `"Booking system is running."`. Then make a test booking on your site. A row should appear in the **Bookings** tab and you should get an email.

### Running your bookings day to day

- **Every booking** is a row in the Bookings tab, and you get an email for each one.
- **Cancel or move a booking**: change its **Status** to `Cancelled` and that time opens up again. To move it, cancel it and book the new time on the site yourself.
- **Block off time** (lunch, a day off, a booking taken over the phone): add a row yourself with Status `Blocked`, then fill in **Date**, **Start** and **End**, e.g. `13:00` to `14:00`. Leave Start and End empty to block the whole day.
- **Customers get a confirmation email** if they give an email address. Turn that off with `emailCustomers: false`.
- **If you change `apps-script.gs` later**: **Deploy › Manage deployments** › pencil icon › Version: **New version** › Deploy. The URL stays the same.

## 3. Put the site online (free)

**GitHub Pages** (where it is now): this folder lives in the `pitch-brawl-play` repo. Once it's merged into `main` it goes live at
`https://ricecooker225.github.io/pitch-brawl-play/booking/`

For a cleaner address, make a new repo (e.g. `magic-massage`), put these files in it, and turn on **Settings › Pages › Deploy from branch › main**.

**Your own domain**: you already have `magicmassageau.com`. Under **Settings › Pages › Custom domain** you can point it at this new site instead of the old one, at the company you bought the domain from. Customers then book at magicmassageau.com.

**Netlify**: go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag this folder in. It's live in seconds.

After you move it, update the two addresses (`og:url` and `og:image`) in EDIT 1 so the Facebook preview works.

## 4. Advertise it on Facebook / Instagram

### a) Turn on tracking (Meta Pixel)
1. Go to **Meta Events Manager** › **Connect data sources** › **Web** › create a **Pixel**.
2. Copy the Pixel ID (a long number) into `index.html` as `metaPixelId: "1234567890",`

The site then reports these events to Facebook:
- `PageView`: someone opened the site
- `ViewContent`: they picked a massage
- `Schedule`: they **booked** (sent with the price as its value)

### b) Create the ad
1. **Ads Manager › Create**. Choose the **Sales** objective (or **Leads**), with **Website** as the conversion location.
2. For the conversion event, pick **Schedule** so Facebook finds people who actually book, not just people who click.
3. Set the website URL to your site and add tracking tags so you can see which ad each booking came from:

   ```
   https://YOUR-SITE/?utm_source=facebook&utm_campaign=december&utm_content=video1
   ```

   Every booking row records **Source**, **Campaign** and **Ad**, so you can see in the sheet which ad made money.

4. Set the call-to-action button to **Book now**.

### c) One ad per massage (optional)
An ad can open the site with a massage already picked, so customers go straight to choosing a time:

```
https://YOUR-SITE/?service=whole-body-60&utm_source=facebook&utm_campaign=whole-body
https://YOUR-SITE/?service=sports&utm_source=facebook&utm_campaign=sports
https://YOUR-SITE/?service=acupuncture-45&utm_source=facebook&utm_campaign=dry-needling
```

The `service` value is the massage `id` from CONFIG, plus `-minutes` when it comes in more than one length.

### d) Check the link preview
Paste your URL into [developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug) and press **Scrape Again** to see the picture and text Facebook will show.

## Good to know

- Times are always Queensland time.
- Google lets a free account send about 100 emails a day, which is plenty for a shop.
- The availability the site loads only says which times are taken. Customer names and phone numbers never leave your sheet.
- If you use the Meta Pixel, you may need a privacy policy, depending on where you are. The footer already mentions the Pixel when it's switched on.
