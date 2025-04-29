import { test, expect } from '@playwright/test';
import { CohortBuilderPage } from '../pages';

test('search by location', async ({ page }) => {
  const cohortBuilderPage = new CohortBuilderPage(page);

  await test.step('When I visit the cohort builder', async () => {
    await cohortBuilderPage.gotoCohortBuilder();
  });

  await test.step('And I select location tab', async () => {
    await cohortBuilderPage.locationTab().click();
  });

  await test.step('And I select the location values', async () => {
    await cohortBuilderPage
      .locationTabPanel()
      .locator('div')
      .filter({ hasText: 'Select locationsOpen menu' })
      .nth(2)
      .click();
    await page.getByRole('option', { name: 'Community Outreach' }).locator('div').first().click();
    await page
      .getByRole('button', {
        name: 'Total items selected: 1,To clear selection, press Delete or Backspace, 1 Clear all selected items Select locations Close menu',
      })
      .click();
    await page.getByRole('button', { name: 'Any Encounter Open menu' }).click();
    await page.getByRole('option', { name: 'Any Encounter' }).getByText('Any Encounter').click();
  });

  await test.step('Then I click the search button', async () => {
    await cohortBuilderPage.searchButton().click();
  });

  await test.step('Then should get a success notification', async () => {
    await expect(cohortBuilderPage.successNotification()).toBeVisible();
  });
});
