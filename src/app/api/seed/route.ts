import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chunkText } from '@/lib/rag/chunker';

const SAMPLE_DOCS = [
  {
    title: 'Tesla Inc. — 2024 Annual Report (10-K)',
    docType: '10k',
    sector: 'Automotive & Technology',
    content: `ITEM 1. BUSINESS

Tesla, Inc. was incorporated in the State of Delaware on July 1, 2003. We design, develop, manufacture and sell high-performance fully electric vehicles and energy generation and storage systems. We also offer services related to our products.

As of December 31, 2024, we produced our vehicles at our manufacturing facilities in Fremont, California; Austin, Texas; Shanghai, China; and Berlin, Germany. Our energy generation and storage systems are produced at our facilities in Fremont, California and Lathrop, California, and we are expanding manufacturing capacity at Gigafactory Nevada.

Revenue for the year ended December 31, 2024 was $96.8 billion, representing an increase of 18% compared to the prior year. Automotive revenues were $78.5 billion, an increase of 15% from 2023. Energy generation and storage revenues were $14.2 billion, an increase of 67% year-over-year.

ITEM 1A. RISK FACTORS

You should carefully consider the risks described below. The risks and uncertainties described below are not the only ones facing us. Additional risks and uncertainties not currently known to us or that we currently consider to be immaterial may also materially adversely affect our business, financial condition or results of operations.

We may be subject to legal proceedings, claims and litigation arising in the ordinary course of business, including product liability claims, warranty claims, consumer protection matters, intellectual property matters and employment matters. We may also be subject to governmental investigations and enforcement actions that may adversely affect our business, financial condition, results of operations or cash flows.

We have identified a material weakness in our internal control over financial reporting related to the design and operating effectiveness of controls over the accuracy and completeness of certain accounting entries and processes. While we are implementing remediation measures, there can be no assurance that our remediation efforts will be successful.

Our business could be adversely affected by cybersecurity incidents, such as ransomware attacks, data breaches, or other security incidents involving our information technology systems or those of our third-party service providers. We have experienced and expect to continue to experience cyber attacks of varying degrees.

Interest rate risk remains a significant factor. A 100 basis point parallel shift in interest rates would result in an estimated $2.8 billion impact on our fixed-income portfolio. Currency risk from our international operations also exposes us to foreign exchange fluctuations.

ITEM 7. MANAGEMENT'S DISCUSSION AND ANALYSIS

Total automotive revenues increased $10.2 billion, or 15%, in 2024 compared to 2023. This increase was primarily due to an increase in total vehicle deliveries, partially offset by a decrease in average selling price. We delivered approximately 1.81 million vehicles in 2024, representing an increase of 7% from 2023.

Energy generation and storage revenues increased $5.7 billion, or 67%, in 2024 compared to 2023, primarily due to an increase in energy storage deployments. Energy storage deployments reached 31.4 GWh in 2024, representing an increase of 113% from 2023.

Gross margin decreased from 18.2% in 2023 to 17.1% in 2024, primarily due to the decrease in average selling price of our vehicles, which was partially offset by cost reductions from improved manufacturing efficiency and lower raw material costs.

Impairment charges of $286 million were recognized during 2024, primarily related to certain manufacturing equipment that was no longer in use due to process changes at our Fremont facility.

We are not in compliance with certain covenants under our credit agreement related to financial reporting deadlines. While we are in discussions with our lenders regarding a waiver, there can be no assurance that such waiver will be obtained on favorable terms, or at all.

Forward Guidance: For 2025, we expect vehicle deliveries to grow by 20-25%, energy storage deployments to grow by at least 50%, and total revenue to exceed $110 billion. We anticipate achieving a full-year gross margin of approximately 18-19% as pricing stabilizes and cost reductions accelerate.`,
  },
  {
    title: 'Goldman Sachs — Q4 2024 Earnings Release',
    docType: 'earnings',
    sector: 'Financial Services',
    content: `GOLDMAN SACHS GROUP INC. — FOURTH QUARTER 2024 EARNINGS RELEASE

Net revenues for the fourth quarter of 2024 were $13.9 billion, 23% higher than the fourth quarter of 2023 and 8% higher than the third quarter of 2024. Net earnings for the fourth quarter of 2024 were $4.1 billion, an increase of 105% compared to the fourth quarter of 2023.

FULL YEAR 2024 RESULTS

Net revenues for the full year 2024 were $53.2 billion, 16% higher than 2023. Net earnings for the full year 2024 were $15.3 billion, 68% higher than 2023. Diluted earnings per common share were $42.14 for 2024, compared to $25.39 for 2023. The annualized return on average common shareholders' equity was 14.3% for 2024.

GLOBAL BANKING & MARKETS

Net revenues in Global Banking & Markets were $33.9 billion for 2024, 24% higher than 2023. Investment Banking revenues were $8.2 billion, 24% higher than 2023, reflecting significantly higher equity underwriting and advisory revenues. FICC revenues were $14.8 billion, essentially unchanged compared to 2023. Equities revenues were $10.9 billion, 21% higher than 2023.

RISK FACTORS AND FORWARD STATEMENTS

We are subject to credit risk from counterparty defaults, which may increase during periods of economic uncertainty or market disruption. Our credit risk exposure is concentrated in financial institutions, sovereign entities, and corporate borrowers. As of December 2024, our total credit exposure was $187 billion.

Interest rate risk remains a significant factor affecting our net interest income and the value of our fixed-income portfolios. A 100 basis point parallel shift in interest rates would result in an estimated $2.8 billion impact on our fixed-income portfolio.

We are subject to ongoing regulatory investigations by the SEC, CFTC, and other governmental authorities related to our trading practices, compliance with sanctions regulations, and anti-money laundering controls. While we continue to cooperate with these investigations, the outcomes remain uncertain and could result in significant fines and penalties.

Our operations are subject to anti-corruption laws, including the FCPA and UK Bribery Act. We have identified certain transactions in our Asia-Pacific operations that may have violated these laws and have voluntarily disclosed these matters to regulators.

Cybersecurity risk continues to be a significant concern. We experienced a data breach in Q3 2024 affecting approximately 12,000 client accounts. While we have implemented enhanced security measures, there can be no assurance that future breaches will not occur.

We identified a related party transaction with an affiliated entity totaling $340 million that was not properly disclosed in prior period financial statements. We have restated our previously issued financial results to correct this disclosure.

Liquidity risk management remains critical to our operations. Our Liquidity Coverage Ratio was 128% as of December 2024, above the 100% regulatory minimum but below our internal target of 135%.`,
  },
  {
    title: 'JP Morgan — 2024 Risk Assessment Report',
    docType: 'risk_assessment',
    sector: 'Financial Services',
    content: `JP MORGAN CHASE & CO. — 2024 RISK ASSESSMENT REPORT

EXECUTIVE SUMMARY

This report provides a comprehensive assessment of the principal risks facing JP Morgan Chase as of December 31, 2024. Our risk management framework is designed to identify, measure, monitor, and control risks across all business lines and geographies.

CREDIT RISK

Total credit exposure was $1.2 trillion as of December 2024. Our allowance for credit losses was $22.3 billion, representing 1.86% of total loans. The firm's credit risk profile has improved modestly over the past year, with non-performing loans declining by 8% to $12.1 billion.

Credit risk concentration remains elevated in commercial real estate (CRE), where we have $178 billion in total exposure. CRE loan delinquencies increased to 3.2% from 2.1% in the prior year, reflecting stress in the office and retail segments. We have increased our CRE-specific reserve by $1.8 billion to $5.6 billion.

MARKET RISK

Value-at-Risk (VaR) at the 99% confidence level was $98 million as of December 2024, compared to $87 million at year-end 2023. The increase reflects higher volatility in interest rate and credit spreads. Our stress testing indicates potential trading losses of up to $18 billion under severely adverse scenarios.

Interest rate risk: A 200 basis point parallel increase in rates would reduce net interest income by approximately $5.4 billion over the next 12 months. Our asset-liability duration gap has widened, creating increased sensitivity to rate movements.

OPERATIONAL RISK

We continue to face significant operational risk from cybersecurity threats, technology failures, and compliance breaches. During 2024, we experienced 14 significant operational loss events totaling $892 million, including:

- A technology failure in our payments processing system that resulted in $340 million in remediation costs and customer compensation
- A data breach affecting 28,000 customer accounts in our wealth management division
- Regulatory fines of $198 million related to deficiencies in our anti-money laundering monitoring systems

REGULATORY AND COMPLIANCE RISK

We are currently subject to 23 active regulatory investigations and enforcement proceedings, including matters related to:

- Sanctions compliance: We identified potential violations of OFAC sanctions regulations in our correspondent banking division. We have voluntarily self-reported these matters and are cooperating with regulators.
- Anti-corruption: Our operations in three countries are under investigation for potential violations of the Foreign Corrupt Practices Act (FCPA).
- Market manipulation: We are defending against allegations of market manipulation in our precious metals trading desk.

The aggregate potential financial exposure from these matters is estimated at $2.8-4.2 billion, although the ultimate outcome remains uncertain.

CLIMATE AND ESG RISK

We have identified climate-related financial risk as a growing concern. Our financed emissions portfolio totals approximately 340 million tonnes of CO2 equivalent. Physical risk exposure to climate events is concentrated in our mortgage and CRE portfolios in coastal regions, with estimated potential losses of $8-12 billion under severe climate scenarios over the next decade.

FORWARD OUTLOOK

For 2025, we anticipate credit costs to increase by 15-20% driven primarily by CRE deterioration. We expect net interest income to decline by 3-5% as rate cuts reduce asset yields. Trading revenues are expected to remain stable, supported by continued market volatility. We have increased our total reserves by $3.1 billion to strengthen our loss absorption capacity.`,
  },
];

export async function POST() {
  try {
    // Check if documents already exist
    const existing = await db.document.count();
    if (existing > 0) {
      return NextResponse.json({
        message: `Database already has ${existing} documents. Delete existing docs first if you want to re-seed.`,
        documentCount: existing,
      });
    }

    const results = [];

    for (const doc of SAMPLE_DOCS) {
      // Create document
      const document = await db.document.create({
        data: {
          title: doc.title,
          filename: `${doc.title.replace(/\s+/g, '_')}.txt`,
          docType: doc.docType,
          sector: doc.sector,
          content: doc.content,
          wordCount: doc.content.split(/\s+/).filter(w => w.length > 0).length,
          status: 'uploaded',
          chunkCount: 0,
        },
      });

      // Chunk the document
      const chunks = chunkText(doc.content, {
        maxChunkSize: 800,
        minChunkSize: 80,
        overlapSize: 60,
      });

      // Store chunks
      if (chunks.length > 0) {
        await db.documentChunk.createMany({
          data: chunks.map(chunk => ({
            documentId: document.id,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            section: chunk.section,
            wordCount: chunk.wordCount,
            charCount: chunk.charCount,
          })),
        });
      }

      // Update document
      await db.document.update({
        where: { id: document.id },
        data: {
          chunkCount: chunks.length,
          status: 'chunked',
        },
      });

      results.push({
        title: doc.title,
        chunks: chunks.length,
        words: document.wordCount,
      });
    }

    return NextResponse.json({
      success: true,
      seeded: results,
      totalDocuments: results.length,
      totalChunks: results.reduce((a, r) => a + r.chunks, 0),
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Wipe all data
    await db.documentChunk.deleteMany();
    await db.analysisSession.deleteMany();
    await db.document.deleteMany();

    return NextResponse.json({ success: true, message: 'All data wiped' });
  } catch (error) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: 'Wipe failed' }, { status: 500 });
  }
}
