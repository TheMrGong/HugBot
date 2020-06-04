# :hugs: HugBot
A Discord bot providing guilds with the best hugs, pats, and tackle hugs!

## :rocket: Features

- Tracking of all ``hugs``, ``pats``, etc, including:
  - Who sent the ``hug``
  - Who received the ``hug``
  - When the ``hug`` was sent
  - In the case of ``tackle hugs``, whether they dodged or accepted it
- Automatic detection of ``hugs``/``pats`` in chat
  - user @hug
  - \*pats user\*
- Energy requirements for doing ``hugs``, ``tackle hugs``, etc
- Ability to get amount of ``hugs``
---

## :bulb: Energy

Actions require energy to be performed. Users will get ``1 energy`` for every message they send in a channel. Every ``minute``, a user's energy will decrease by one.

### Energy Requirments

This is how much energy each action takes to do

| Action     | Energy required  |
| :--------- | :--------------: |
| Hug        | No energy needed |
| Tackle hug |    10 energy     |
| Pat        | No energy needed |
| Glomp      |     5 energy     |
| Tickle     |     2 energy     |
| Flirt      | No energy needed |

## :keyboard: Commands

| Command    | Syntax             | Example           | Help                                                                     |
| ---------- | ------------------ | ----------------- | ------------------------------------------------------------------------ |
| ?hug       | ?hug \[user]       | ?hug @Góngo       | Sends a hug to someone!                                                  |
| ?hugs      | ?hugs \[user]      | ?hugs @Góngo      | Shows you how many hugs you've received                                  |
| ?glomp     | ?glomp \[user]     | ?glomp @Góngo     | A softer form of tacklehug, but with all the love!                       |
| ?glomps    | ?glomps \[user]    | ?glomps @Góngo    | Shows you how many glomps you or someone else have received              |
| ?tickle    | ?tickle \[user]    | ?tickle @Góngo    | Rain tickles upon an unsuspecting Discord user!                          |
| ?tickles   | ?tickles \[user]   | ?tickles @Góngo   | Shows you how much mayhem you or someone else have inflicted!            |
| ?pat       | ?pat \[user]       | ?pat @Góngo       | Gives the person a nice pat!                                             |
| ?tacklehug | ?tacklehug \[user] | ?tacklehug @Góngo | Tackle hugs someone, but they are able to dodge/accept                   |
| ?energy    | ?energy \[user]    | ?energy @Góngo    | Shows you how much energy someone has, or yourself if noone is specified |
| ?flirt     | ?flirt \[user]     | ?flirt @Góngo     | Allows you to send some love to someone.                                 |

## :orange_book: License

Hug Bot is licensed under the [**GNU General Public License v3 (GPL-3)**](https://www.gnu.org/copyleft/gpl.html)!
