# Upstream humanizer, what to merge

Source: `blader/humanizer` v3.1.0, `SKILL.md`, MIT, 397 lines. Read on 2026-10-30.

This file holds only the parts that `surface-patterns.md` and `SKILL.md` do not already carry. Every
numbered pattern in the upstream list has a counterpart here, usually under a different number, so
copying them again would create two vocabularies for one tell. Use this as the merge sheet when the
ultimate skill is built, then delete it.

## Two rules that grade every other rule

Upstream opens with a weighting our list does not have. All 41 patterns currently read as equal,
which makes a weak signal behave like a strong one.

1. **Every sentence kept must add something the reader did not already have**, from earlier in the
   text or from the conversation around it. This is the test behind every pattern, and it is
   sharper than "does it sound like AI".
2. **A tell counts in proportion to how rarely a careful writer would make it on purpose.** The
   patterns are ordered strongest first. §1 to §5 justify an edit on one sighting. A pattern marked
   *weak alone* needs company from other tells in the same passage before anything is changed.

Copy rule 2 into the ultimate skill as the ordering principle. It resolves the conflict our
false-positive list only half addresses: a single dash, one qualifier, one formal word, and one
curly quote are all weak alone, and the list says so without saying what "alone" means.

## The diagnostic frame

Upstream explains why the patterns exist before listing them. A model picks the choice that fits
the widest range of readers and subjects; a person picks for one reader and one subject, so their
choices come out uneven and specific. Each pattern is one form of that default:

- staging: the sentence signals importance instead of adding a fact
- rhythm by rule: triads and dashes applied everywhere
- inflation: an ordinary fact dressed as pivotal or expert-backed
- formatting by rule: bold and title case on every item
- leftovers: chat wrappers and drafting moves meant for nobody
- wrong reader: a reply that rebuilds context the other person already has

The frame is worth keeping because it survives model releases. Word habits turn over every few
months. The six defaults do not. It also gives the writer a question to ask of a sentence that
matches no pattern on the list: which default produced it.

## Patterns missing from our list

These are the three that have no counterpart in `surface-patterns.md`.

### Vague connection or association

Watch for: associated with, in association with, connected to, in connection with, linked to,
tied to.

The text says two things are related without saying how. "He was associated with the leadership of
ExampleCorp" hides whether he was the CEO, a board member, or a consultant. Name the relationship
the source gives. If the source does not say, keep the vague wording rather than inventing a role.

### Writing about the document instead of its subject

Watch for: what the text replaced, how it was assembled ("generated from", "compiled from",
"anything unconfirmed is flagged rather than guessed"), and a legend, layout or order the reader
can already see ("the table below compares", "this section is organized by owner").

Our §30 covers the previous-version half. The other half is missing: the account of how the work
was done, and the description of a page the reader is looking at. Mention a previous version only
in change logs, release notes and migration guides. Keep a source credit the reader can follow.
Keep a caveat that changes what the reader should do. State a convention only when the reader
cannot infer it, and state it once. One description of the page is weak alone.

### Writing for the wrong reader

Watch for: a short reply that restates the problem, walks through the diagnosis, and lays out the
evidence before it reaches the decision; a query or a set of numbers included to prove a plan will
work; background the other person wrote or already agreed to; the answer sitting in the last line.

This is the one pattern that needs the surrounding conversation. In a reply the reader already has
the context, so rebuilding it buries the point. Lead with the decision and keep only the reasoning
that would change whether the reader agrees, usually one fact they lack and any link they need to
act. The diagnosis and the proof belong in the ticket that follows. A reviewer raising a topic is
not a request for the full write-up. When the surrounding conversation is invisible, ask or leave
the text alone.

## Refinements to patterns we already have

**Closers that explain the example.** Our §31 covers dramatic fragments and forced punchlines. It
does not cover the sentence that follows an example, a scene or a number and names what it showed:
"This shows the importance of...", "The message was clear:", "It was a lesson in patience." That
sentence is a closer even when it is the only one in the passage, because the example already
showed it. Cut it unless it adds a consequence the example does not contain.

**Scale of a pattern.** Upstream judges inflation and triads at three scales: the phrase, the stock
section ("Challenges and Legacy", "Future Outlook"), and the send-off paragraph. One instance at
phrase scale is weak. The stock section is strong enough on its own. Our list describes the phrase
and the send-off; the stock section is the middle scale worth naming.

**Repetition is not banned.** Upstream's repeated-openings pattern (their §7) says explicitly not
to ban the repeated word: a remaining sentence may still start with "She", and "She came. She saw.
She conquered." is deliberate. Our §39 runs the other way, close to a ban. When merging, keep the
explicit permission.

## The draft check upstream runs

Ours has the gate and the checker. Upstream adds the order of the second pass, which is cheap and
catches what a full rewrite reintroduces:

1. Read the whole text once first and mark every pattern, strongest first. Look at paragraph shape,
   not only sentences. A contrast split across two sentences, three parallel examples, or the same
   closer after every section is one tell at a larger scale.
2. Rewrite by paragraph around its main point, not phrase by phrase. A sentence that stays awkward
   after patching gets its paragraph rewritten.
3. Read the draft aloud. Ask what still sounds AI-generated.
4. Search again for the five tells that survive a rewrite, in this order: not-X-but-Y contrasts,
   one-line closers, forced triads, dashes, bold labels.

Step 4 is worth copying as written. Four named tells in a fixed order is a checklist a person can
run; "check everything again" is not.

## The "when not to act" caveat

Our false-positive list covers quotations, titles, proper names, pre-2022 text and human details.
Upstream adds one sentence that changes how the rest of the skill should be read: people who judge
AI text by feel do little better than chance, and human writing keeps absorbing AI habits, so
several tells together are the safeguard, not any single one. Keep it. It is the honest frame for
a skill whose checker measures five numbers and cannot see structure.

## What not to copy

**Return format.** Upstream returns the draft, a list of remaining patterns, and the final rewrite
for pasted text. The local skill now returns the text alone with no chatter, and a meta note only
inside a `###################` block. Upstream's format is the older style and would undo that.

**Its pattern vocabulary.** Their §1 to §26 and our §1 to §41 describe overlapping material. Pick
one numbering when the ultimate skill is written; do not carry both.
