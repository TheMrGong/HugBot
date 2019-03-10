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
| Tackle hug | 10 energy        |
| Pat        | No energy needed |

## :keyboard: Commands

| Command | Syntax | Example | Help |
| --- | --- | --- | --- |
| ?hug | ?hug \[user] | ?hug @TheMrGong | Sends a hug to someone!
| ?hugs | ?hugs \[user] | ?hugs @TheMrGong | Shows you how many hugs you've received
| ?pat | ?pat \[user] | ?pat @TheMrGong | Gives the person a nice pat!
| ?tacklehug | ?tacklehug (user) | ?tacklehug @TheMrGong | Tackle hugs someone, but they are able to dodge/accept
| ?energy | ?energy \[user] | ?energy @TheMrGong | Shows you how much energy someone has, or yourself if noone is specified

## :orange_book: License

Hug Bot is licensed under the [**GNU General Public License v3 (GPL-3)**](https://www.gnu.org/copyleft/gpl.html)!