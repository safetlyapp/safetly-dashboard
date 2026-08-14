import "dotenv/config";

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { db } from "../src/db";
import {
  faqCategories,
  faqItems,
  pricingPlans,
  reviews,
} from "../src/db/schema";

type PricingSourcePlan = {
  id: string;
  name: string;
  price: string;
  per: string;
  billedNote: string;
  strikeNote?: string;
  cta: string;
  accent: string;
  popular: boolean;
  features: string[];
};

type ReviewSource = {
  quote: string;
  name: string;
  date: string;
  initials: string;
};

type FaqSourceCategory = {
  title: string;
  items: Array<{ q: string; a: string }>;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");

function extractConstArray<T>(filePath: string, constName: string): T[] {
  const sourceText = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== constName) continue;
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
        throw new Error(`"${constName}" in ${filePath} is not a const array.`);
      }

      const arrayText = declaration.initializer.getText(sourceFile);
      return Function(`"use strict"; return (${arrayText});`)() as T[];
    }
  }

  throw new Error(`Could not find "${constName}" in ${filePath}.`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toHtmlParagraph(value: string): string {
  return `<p>${escapeHtml(value)}</p>`;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

async function main() {
  const pricingSource = extractConstArray<PricingSourcePlan>(
    resolve(repoRoot, "safetly-app/src/components/home/Pricing.tsx"),
    "PLANS",
  );
  const reviewSource = extractConstArray<ReviewSource>(
    resolve(repoRoot, "safetly-app/src/components/home/Reviews.tsx"),
    "REVIEWS",
  );
  const faqSource = extractConstArray<FaqSourceCategory>(
    resolve(repoRoot, "safetly-app/src/lib/faq-data.ts"),
    "FAQ_CATEGORIES",
  );

  const pricingRows = pricingSource.map((plan, index) => ({
    planId: plan.id,
    name: plan.name,
    price: plan.price,
    per: plan.per,
    billedNote: plan.billedNote,
    strikeNote: plan.strikeNote ?? null,
    cta: plan.cta,
    accentColor: plan.accent,
    isPopular: plan.popular,
    isActive: true,
    displayOrder: index,
    features: plan.features,
  }));

  const reviewRows = reviewSource.map((review, index) => ({
    name: review.name,
    quote: review.quote,
    rating: 5,
    reviewDate: parseDate(review.date),
    initials: review.initials,
    status: "approved" as const,
    isFeatured: true,
    displayOrder: index,
  }));

  const categoryRows = faqSource.map((category, index) => ({
    title: category.title,
    displayOrder: index,
    isPublished: true,
  }));

  const itemRows = faqSource.flatMap((category, categoryIndex) =>
    category.items.map((item, itemIndex) => ({
      categoryTitle: category.title,
      question: toHtmlParagraph(item.q),
      answer: toHtmlParagraph(item.a),
      displayOrder: categoryIndex * 100 + itemIndex,
      isPublished: true,
    })),
  );

  await db().transaction(async (tx) => {
    await tx.delete(faqItems);
    await tx.delete(faqCategories);
    await tx.delete(reviews);
    await tx.delete(pricingPlans);

    await tx.insert(pricingPlans).values(pricingRows);
    await tx.insert(reviews).values(reviewRows);

    const insertedCategories = await tx
      .insert(faqCategories)
      .values(categoryRows)
      .returning({ id: faqCategories.id, title: faqCategories.title });

    const categoryIdByTitle = new Map(
      insertedCategories.map((category) => [category.title, category.id]),
    );

    await tx.insert(faqItems).values(
      itemRows.map((item) => {
        const categoryId = categoryIdByTitle.get(item.categoryTitle);
        if (!categoryId) {
          throw new Error(`Missing category id for "${item.categoryTitle}".`);
        }

        return {
          categoryId,
          question: item.question,
          answer: item.answer,
          displayOrder: item.displayOrder,
          isPublished: item.isPublished,
        };
      }),
    );
  });

  console.log(
    [
      `Seeded pricing plans: ${pricingRows.length}`,
      `Seeded reviews: ${reviewRows.length}`,
      `Seeded FAQ categories: ${categoryRows.length}`,
      `Seeded FAQ items: ${itemRows.length}`,
    ].join("\n"),
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
