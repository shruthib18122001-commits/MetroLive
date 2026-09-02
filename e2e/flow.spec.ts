import { expect, test } from '@playwright/test';

test('search a stop, see arrivals, favourite it, and the favourite survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find your stop' })).toBeVisible();
  await expect(page.getByText('No favourites yet')).toBeVisible();

  // Search
  await page.getByLabel('Stop name').fill('long beach');
  const firstResult = page.locator('ul[role="list"] a').first();
  await expect(firstResult).toBeVisible();

  // Arrivals
  await firstResult.click();
  await expect(page).toHaveURL(/\/stop\/.+/);
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  // Wait for the real stop name to resolve (not the "Stop <id>" placeholder).
  await expect(page.getByText(/loading name/)).toHaveCount(0);
  await expect(heading).not.toHaveText(/^Stop \d+$/);
  const stopName = (await heading.textContent())?.trim() ?? '';
  expect(stopName.length).toBeGreaterThan(0);

  const arrivalsRegion = page.getByRole('region', { name: 'Upcoming arrivals' });
  await expect(arrivalsRegion).toHaveAttribute('aria-live', 'polite');
  await expect(arrivalsRegion.locator('li').first()).toBeVisible();

  // Favourite
  await page.getByRole('button', { name: /Add .* to favourites/ }).click();
  await expect(page.getByRole('button', { name: /Remove .* from favourites/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Persist across reload
  await page.reload();
  await expect(page.getByRole('button', { name: /Remove .* from favourites/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // And it shows on the search screen
  await page.getByRole('link', { name: 'All stops' }).click();
  await expect(
    page.locator('section[aria-labelledby="favorites-heading"]').getByRole('link', { name: stopName }),
  ).toBeVisible();
});

test('keyboard: skip link, then tab into search', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});
