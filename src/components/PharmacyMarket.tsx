import { formatSom, getMarketData } from "../data/market";
import type { MarketProduct } from "../data/market";

export function PharmacyMarket({ product, catalog = [] }: { product: MarketProduct; catalog?: MarketProduct[] }) {
  const data = getMarketData(product, catalog);
  const offerMax = Math.max(...data.offers.map((offer) => offer.price), 1);
  const trendMax = Math.max(...data.trend.map((point) => point.price), 1);
  const trendMin = Math.min(...data.trend.map((point) => point.price));

  return (
    <section className="extraPanel marketPanel" aria-label={data.isPharmacyProduct ? "Apteka narxlari" : "Onlayn narxlar"}>
      <header className="extraHead">
        <div>
          <h2>{data.isPharmacyProduct ? "Apteka narxlari" : "Onlayn narxlar"}</h2>
          <p>
            {data.isPharmacyProduct
              ? "Oson Apteka va Arzon Apteka kabi agregatorlardagi takliflar bilan taqqoslash."
              : "Onlayn marketplace takliflari va o'xshash mahsulotlar."}
          </p>
        </div>
        <span className="demoTag">Demo narxlar</span>
      </header>

      <div className="marketStats">
        <div>
          <span>Eng past narx</span>
          <strong>{formatSom(data.min)}</strong>
        </div>
        <div>
          <span>O'rtacha narx</span>
          <strong>{formatSom(data.average)}</strong>
        </div>
        <div>
          <span>Eng yuqori</span>
          <strong>{formatSom(data.max)}</strong>
        </div>
        <div>
          <span>Tejash</span>
          <strong>{data.savingsPercent}%</strong>
        </div>
        <div>
          <span>Mavjudlik</span>
          <strong>{data.availability}%</strong>
        </div>
      </div>

      <div className="offerList">
        {data.offers.map((offer) => (
          <article className="offerRow" key={offer.id}>
            <div className="offerWho">
              <span className="offerLogo">{offer.pharmacy.slice(0, 1)}</span>
              <div>
                <b>{offer.pharmacy}</b>
                <small>{offer.city} · {offer.delivery} · ★ {offer.rating}</small>
              </div>
            </div>
            <div className="offerPrice">
              <b>{formatSom(offer.price)}</b>
              {offer.oldPrice && <s>{formatSom(offer.oldPrice)}</s>}
            </div>
            <div className="offerBar" aria-hidden="true">
              <i style={{ width: `${(offer.price / offerMax) * 100}%` }} />
            </div>
            <div className="offerBadges">
              {offer.badge && <span className="offerBadge">{offer.badge}</span>}
              <span className={offer.inStock ? "stockOk" : "stockOut"}>{offer.inStock ? "Mavjud" : "Tugagan"}</span>
            </div>
            <a className="offerLink" href={offer.link} target="_blank" rel="noreferrer noopener">Ochish ↗</a>
          </article>
        ))}
      </div>

      <div className="marketLower">
        <div className="marketTrend">
          <h3>Narx tendensiyasi · 6 oy</h3>
          <div className="trendChart">
            {data.trend.map((point) => (
              <div className="trendPoint" key={point.label}>
                <span>{point.price.toLocaleString("uz-UZ")}</span>
                <i style={{ height: `${Math.max(10, ((point.price - trendMin * 0.9) / (trendMax - trendMin * 0.9 || 1)) * 100)}%` }} />
                <small>{point.label}</small>
              </div>
            ))}
          </div>
          <p className="chartNote">Eng past va eng yuqori taklif o'rtasidagi farq {data.savingsPercent}%.</p>
        </div>

        <div className="marketSimilar">
          <h3>O'xshash mahsulotlar</h3>
          {data.similar.map((item) => (
            <div className="similarRow" key={item.name}>
              <div>
                <b>{item.name}</b>
                <small>{item.reason}</small>
              </div>
              <span>{formatSom(item.price)}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="marketFoot">
        <div className="aggregatorLinks">
          {data.aggregatorLinks.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noreferrer noopener">{link.name} ↗</a>
          ))}
        </div>
        <p className="extraNote">
          Hamkor API hali ulanmagan. Narxlar va mavjudlik demo ma'lumot bo'lib, xariddan oldin agregator saytida tekshiring.
        </p>
      </footer>
    </section>
  );
}