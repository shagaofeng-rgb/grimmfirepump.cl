# Old-code removal plan

No legacy News auto-publisher was found in the repository or in the current Vercel cron definitions. Therefore this change removes no Blog code, no historical content, and no existing scheduled job.

The legacy physical `news_*` table names are **not** removed or renamed: they still power the existing Blog system. The new namespaced News implementation is additive and reversible.

Potential follow-up only: rename the Chinese admin label currently shown as “新闻管理” for the legacy Blog store to “Blog 管理”. This is an interface clarification and not part of the automated publisher protocol.
