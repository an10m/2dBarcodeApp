import { getInsights } from "../data/insights";
import type { InsightProduct } from "../data/insights";

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= filled ? "on" : ""} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export function ProductInsights({ product }: { product: InsightProduct }) {
  const data = getInsights(product);
  const maxMonth = Math.max(...data.monthly.map((month) => month.count), 1);
  const maxTheme = Math.max(...data.themes.map((theme) => theme.percent), 1);
  const ratingDiff = Number((data.rating - data.categoryAvg).toFixed(1));
  const diffLabel = ratingDiff === 0
    ? "Toifa o'rtachasi bilan bir xil"
    : `${ratingDiff > 0 ? "↑" : "↓"} toifa o'rtachasidan ${Math.abs(ratingDiff).toFixed(1)}`;

  return (
    <section className="extraPanel insightPanel" aria-label="Sharhlar tahlili">
      <header className="extraHead">
        <div>
          <h2>Sharhlar tahlili</h2>
          <p>Dorixona cheklari, marketplace va ijtimoiy tarmoqlardan yig'ilgan fikrlar asosida.</p>
        </div>
        <span className="demoTag">Demo agregatsiya</span>
      </header>

      <div className="insightTop">
        <div className="insightScore">
          <strong>{data.rating.toFixed(1)}</strong>
          <Stars rating={data.rating} />
          <small>{data.count.toLocaleString("uz-UZ")} sharh</small>
          <span className={ratingDiff >= 0 ? "deltaUp" : "deltaDown"}>{diffLabel}</span>
        </div>

        <div className="distribution">
          {[5, 4, 3, 2, 1].map((star) => {
            const value = data.distribution[star - 1] ?? 0;
            const percent = Math.round((value / data.count) * 100);
            return (
              <div className="distRow" key={star}>
                <span>{star} ★</span>
                <i><b style={{ width: `${percent}%` }} /></i>
                <em>{percent}%</em>
              </div>
            );
          })}
        </div>

        <div className="insightQuick">
          <div><strong>{data.positive}%</strong><span>Ijobiy fikr</span></div>
          <div><strong>{data.verifiedShare}%</strong><span>Tasdiqlangan xarid</span></div>
          <div><strong>{data.repeatRate}%</strong><span>Qayta xarid</span></div>
          <div><strong>{data.returnRate}%</strong><span>Qaytarish</span></div>
        </div>
      </div>

      <div className="insightCharts">
        <div className="insightChart">
          <h3>Eng ko'p tilga olingan mavzular</h3>
          {data.themes.map((theme) => (
            <div className="themeRow" key={theme.label}>
              <span>{theme.label}</span>
              <i><b style={{ width: `${(theme.percent / maxTheme) * 100}%` }} /></i>
              <em>{theme.mentions.toLocaleString("uz-UZ")}</em>
            </div>
          ))}
        </div>

        <div className="insightChart">
          <h3>Oylik fikr oqimi</h3>
          <div className="monthChart">
            {data.monthly.map((month) => (
              <div className="monthBar" key={month.label}>
                <span className="monthCount">{month.count}</span>
                <i style={{ height: `${Math.max(8, (month.count / maxMonth) * 100)}%` }} title={`${month.count} sharh`} />
                <small>{month.label}</small>
                <em>{month.rating}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="insightChart">
          <h3>Toifa bilan taqqoslash</h3>
          <div className="compareRow">
            <span>Reyting</span>
            <div><i><b style={{ width: `${(data.rating / 5) * 100}%` }} /></i><em>{data.rating}</em></div>
            <div className="mutedBar"><i><b style={{ width: `${(data.categoryAvg / 5) * 100}%` }} /></i><em>{data.categoryAvg}</em></div>
          </div>
          <div className="compareRow">
            <span>Qaytarish</span>
            <div><i className="warn"><b style={{ width: `${Math.min(100, data.returnRate * 14)}%` }} /></i><em>{data.returnRate}%</em></div>
            <div className="mutedBar"><i><b style={{ width: `${Math.min(100, data.categoryReturnRate * 14)}%` }} /></i><em>{data.categoryReturnRate}%</em></div>
          </div>
          <div className="compareRow">
            <span>Narx indeksi</span>
            <div><i><b style={{ width: `${Math.min(100, data.priceIndex)}%` }} /></i><em>{data.priceIndex}</em></div>
            <div className="mutedBar"><i><b style={{ width: "100%" }} /></i><em>100</em></div>
          </div>
          <p className="chartNote">Pastki kulrang chiziq — toifa o'rtachasi. Narx indeksida 100 = bozor o'rtachasi.</p>
        </div>
      </div>

      <div className="commentList">
        <div className="commentListHead">
          <h3>Xaridorlar fikrlari</h3>
          <span>Namuna: {data.comments.length} ta so'nggi sharh</span>
        </div>
        {data.comments.map((comment) => (
          <article className="commentCard" key={comment.id}>
            <div className="commentTop">
              <span className="commentAvatar">{comment.author.slice(0, 1)}</span>
              <div className="commentWho">
                <b>{comment.author}</b>
                <small>{comment.city} · {comment.date}</small>
              </div>
              <span className="commentSource">{comment.source}</span>
            </div>
            <div className="commentMeta">
              <Stars rating={comment.rating} />
              {comment.verified && <span className="verifiedChip">Tasdiqlangan xarid</span>}
              <span className="themeChip">{comment.theme}</span>
            </div>
            <p>{comment.text}</p>
            <footer className="commentFoot">
              <span>👍 Foydali · {comment.helpful}</span>
              <span>{comment.source}</span>
            </footer>
          </article>
        ))}
      </div>

      <p className="extraNote">
        Manbalar: {data.sources.join(", ")}. Haqiqiy marketplace API hali ulanmagan — ko'rsatkichlar demo ma'lumot.
      </p>
    </section>
  );
}