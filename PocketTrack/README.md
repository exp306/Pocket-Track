# PocketTrack — Personal Finance Tracker

PocketTrack is a responsive, browser-based personal finance dashboard built with **HTML, CSS, and vanilla JavaScript**. It is designed as a learning project for practicing DOM manipulation, events, arrays, objects, calculations, JSON, and browser storage.

## Features

- Dashboard with total balance, income, and expenses
- Add, edit, and delete income and expense transactions
- Categories that change depending on transaction type
- Search by description or category
- Filter by transaction type and category
- Sort by date or amount
- Expense breakdown by category
- Monthly income, expense, and net summary
- Save records in `localStorage`
- Export transaction records as CSV
- Dark mode toggle
- Responsive desktop and mobile layout
- Input validation and empty states

## Project structure

```text
PocketTrack/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Run locally

1. Download and extract the project folder.
2. Open the folder in Visual Studio Code.
3. Open `index.html` in your browser, or use the VS Code Live Server extension.
4. Add a transaction to test the app.

No npm install, framework, build process, or backend is required. Google Fonts are loaded from the internet; system fonts are used as a fallback.

## How the app works

### 1. Data model

Each transaction is a JavaScript object:

```js
{
  id: "unique-id",
  type: "expense",
  description: "Lunch",
  amount: 25000,
  category: "Food & Drink",
  date: "2026-10-23"
}
```

All records are held in the `transactions` array while the app is running.

### 2. Calculations

`calculateTotals()` uses `reduce()` to calculate income and expenses from the transaction array. Balance is calculated as:

`balance = income - expenses`

The app recalculates totals after every add, edit, or delete operation. This keeps the array as the single source of truth.

### 3. Rendering

Rendering functions read the current data and update the DOM:

- `renderSummary()` updates dashboard totals.
- `renderRecentTransactions()` displays the latest five records.
- `renderTransactionTable()` displays the filtered transaction list.
- `renderBreakdown()` groups expenses by category.

### 4. Browser storage

`saveTransactions()` converts the array into a JSON string with `JSON.stringify()` and saves it to `localStorage`.

`loadTransactions()` reads the string and converts it back into JavaScript data with `JSON.parse()` when the page starts.

Data is stored only in the current browser profile on the current device. It is not a cloud backup and is not synchronized across devices. Clearing browser site data can remove it.

## JavaScript concepts practiced

| Concept | Where it appears |
|---|---|
| `const` and `let` | Application state and variables |
| Objects | Individual transaction records |
| Arrays | Collection of transactions |
| Functions | Reusable operations |
| `if` / `else` | Validation and conditional logic |
| `addEventListener()` | Buttons, forms, filters, and navigation |
| `map()` | Rendering transaction rows |
| `filter()` | Search, filtering, and deletion |
| `find()` | Finding a transaction by ID |
| `reduce()` | Totals and category grouping |
| `sort()` | Ordering transaction records |
| DOM manipulation | Updating page content |
| `JSON.stringify()` / `JSON.parse()` | Saving and loading data |
| `try...catch` | Handling storage or parsing errors |
| `Blob` and object URLs | CSV export |

## Important notes and limitations

- This is a front-end learning project, not a banking application.
- There is no login, cloud database, encryption layer, or multi-device synchronization.
- Do not store passwords, bank credentials, or sensitive financial information in this demo.
- The displayed balance is the net total of transactions entered in PocketTrack. It is not a verified bank balance.
- The monthly report uses the current calendar month based on the transaction date.
- CSV export includes the transaction records currently stored in the app.

## Suggested learning exercises

1. Add a new category to the expense category list.
2. Add a confirmation dialog before deleting a transaction.
3. Add a date-range filter.
4. Add an opening balance.
5. Add a monthly spending limit and a warning when it is exceeded.
6. Add a chart library after understanding the current category breakdown.
7. Refactor the JavaScript into modules when the single-file version feels comfortable.

## Deployment

This is a static website and can be deployed to GitHub Pages, Netlify, or Vercel.

For Vercel:
1. Push the `PocketTrack` folder to a GitHub repository.
2. Import the repository into Vercel.
3. Set the framework preset to **Other**.
4. Leave the build command empty.
5. Set the output directory to `.` (project root).
6. Deploy.

Make sure `index.html` is in the root of the deployed project.

---

Built as a learning project with HTML, CSS, and vanilla JavaScript.
