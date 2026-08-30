# Future Tools

## Implemented

| Tool | Description |
|------|-------------|
| Compound calculator | Investment growth with Irish tax modes, fees, and nominal vs real balances |
| Irish mortgage calculator | Borrowing limits, amortization, stamp duty, HTB/FHS, green BER rates, overpayments |
| Pension tax relief | Age-band allowances, income-tax saved vs unused headroom, current vs proposed tax bands |
| Irish auto-enrolment (My Future Fund) | Contribution schedule, opt-out/suspend, and comparison with occupational/PRSA relief |
| Net worth snapshot | Manual asset/liability entry, grouped mix and access charts |
| Emergency fund runway | Months of cash left, jobseeker and other income, cash needed for a chosen target |

## Backlog

1. **Stamp duty + purchase cost estimator** — quick property transaction total.
2. **Rent vs buy breakeven** — uses profile salary + mortgage tool outputs.
3. **CGT calculator** — disposal proceeds, indexation off (post-2003), €1,270 exemption.
4. **FIRE / savings target** — target portfolio given spend rate, Irish tax-aware withdrawal.
5. **Debt payoff comparator** — avalanche vs snowball.
6. **Deposit vs ETF after DIRT** — simple two-track comparison for cash savings.

## Adding a tool

Follow [`docs/DESIGN.md`](DESIGN.md) for layout and field helpers.

1. Create `src/tools/<id>/` with `index.ts`, `engine.ts`, `learn.ts`, `<Name>Tool.tsx`
2. Register in `src/tools/registry.ts` (include `learn` on the definition)
3. Add defaults under `[<id>]` in `config/defaults.txt`
4. Move the tool from Backlog to implemented in this file
