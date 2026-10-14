use std::collections::HashMap;

use async_trait::async_trait;
use diesel::dsl::max;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;

use crate::db::corpus::{
    eras, feeling_stats, feeling_verses, feelings, poem_verses, poems, poets, verses,
};
use crate::db::{PgPool, int, present};
use crate::domain::feelings::{Feeling, FeelingRepository, FeelingVerse};
use crate::domain::poems::PoemLink;
use crate::domain::{PoetBrief, StoreError, Term};

pub struct PgFeelings {
    pool: PgPool,
}

impl PgFeelings {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

type FeelingRow = (i32, Option<i32>, String, String, Option<String>, i32);
type VerseRow = (
    i32,
    i32,
    String,
    String,
    String,
    String,
    String,
    String,
    String,
    bool,
    bool,
    String,
    String,
);

fn verse(
    (
        _,
        position,
        content,
        feeling_name,
        feeling_slug,
        title,
        poem_slug,
        poet_name,
        poet_slug,
        has_avatar,
        is_anonymous,
        era_name,
        era_slug,
    ): VerseRow,
) -> FeelingVerse {
    FeelingVerse {
        parts: content.split('*').map(str::to_string).collect(),
        position,
        feeling: Term {
            name: feeling_name,
            slug: feeling_slug,
        },
        poem: PoemLink {
            title,
            slug: poem_slug,
        },
        poet: PoetBrief {
            name: poet_name,
            slug: poet_slug,
            has_avatar,
            is_anonymous,
        },
        era: Term {
            name: era_name,
            slug: era_slug,
        },
    }
}

#[async_trait]
impl FeelingRepository for PgFeelings {
    async fn all(&self) -> Result<Vec<Feeling>, StoreError> {
        let mut conn = self.pool.get().await?;
        Ok(feelings::table
            .select((
                feelings::id,
                feelings::parent_id,
                feelings::slug,
                feelings::name,
                feelings::wheel_term,
                feelings::sort_order,
            ))
            .order(feelings::id.asc())
            .load::<FeelingRow>(&mut conn)
            .await?
            .into_iter()
            .map(
                |(id, parent_id, slug, name, wheel_term, sort_order)| Feeling {
                    id,
                    parent_id,
                    slug,
                    name,
                    wheel_term,
                    sort_order,
                },
            )
            .collect())
    }

    async fn branch_counts(&self) -> Result<Vec<(i32, i32)>, StoreError> {
        let mut conn = self.pool.get().await?;
        feeling_stats::table
            .select((feeling_stats::id, feeling_stats::verses_count))
            .load::<(i32, Option<i64>)>(&mut conn)
            .await?
            .into_iter()
            .map(|(id, count)| Ok((id, int(present(count)?)?)))
            .collect()
    }

    async fn verses(
        &self,
        feeling_ids: &[i32],
        page: u32,
        page_size: u32,
    ) -> Result<Vec<FeelingVerse>, StoreError> {
        let mut conn = self.pool.get().await?;
        let offset = i64::from(page.saturating_sub(1)).saturating_mul(i64::from(page_size));
        let keys = feeling_verses::table
            .inner_join(poems::table.on(poems::id.eq(feeling_verses::poem_id)))
            .inner_join(poets::table.on(poets::id.eq(poems::poet_id)))
            .filter(feeling_verses::feeling_id.eq_any(feeling_ids))
            .filter(poems::is_hidden.eq(false))
            .filter(poems::recension_of_id.is_null())
            .filter(poets::is_hidden.eq(false))
            .group_by((feeling_verses::poem_id, feeling_verses::position))
            .select((feeling_verses::poem_id, feeling_verses::position))
            .order((
                max(feeling_verses::strength).desc(),
                feeling_verses::poem_id.asc(),
                feeling_verses::position.asc(),
            ))
            .limit(i64::from(page_size))
            .offset(offset)
            .load::<(i32, i32)>(&mut conn)
            .await?;
        let poem_ids: Vec<i32> = keys.iter().map(|(poem, _)| *poem).collect();
        let positions: Vec<i32> = keys.iter().map(|(_, position)| *position).collect();
        let rows = feeling_verses::table
            .inner_join(feelings::table)
            .inner_join(
                poem_verses::table.on(poem_verses::poem_id
                    .eq(feeling_verses::poem_id)
                    .and(poem_verses::position.eq(feeling_verses::position))),
            )
            .inner_join(verses::table.on(verses::id.eq(poem_verses::verse_id)))
            .inner_join(poems::table.on(poems::id.eq(feeling_verses::poem_id)))
            .inner_join(poets::table.on(poets::id.eq(poems::poet_id)))
            .inner_join(eras::table.on(eras::id.eq(poems::era_id)))
            .filter(feeling_verses::feeling_id.eq_any(feeling_ids))
            .filter(feeling_verses::poem_id.eq_any(&poem_ids))
            .filter(feeling_verses::position.eq_any(&positions))
            .order((
                feeling_verses::strength.desc(),
                feeling_verses::feeling_id.asc(),
            ))
            .select((
                feeling_verses::poem_id,
                feeling_verses::position,
                verses::content,
                feelings::name,
                feelings::slug,
                poems::title,
                poems::slug,
                poets::name,
                poets::slug,
                poets::has_avatar,
                poets::is_anonymous,
                eras::name,
                eras::slug,
            ))
            .load::<VerseRow>(&mut conn)
            .await?;
        let mut strongest: HashMap<(i32, i32), VerseRow> = HashMap::new();
        for row in rows {
            strongest.entry((row.0, row.1)).or_insert(row);
        }
        Ok(keys
            .iter()
            .filter_map(|key| strongest.remove(key))
            .map(verse)
            .collect())
    }
}
