import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './DutchAuctionDemo.module.css';
// Import web3 libraries
import Web3 from 'web3';
import Web3Modal from 'web3modal';

const initialParticipants = [
  { name: 'Alice', budget: 15000 },
  { name: 'Bob', budget: 10000 },
  { name: 'Charlie', budget: 8000 },
  { name: 'David', budget: 7000 },
];

const dutchmanOverview = {
  name: "The Dutchman",
  description: "Ensuring fairness in token sales through innovative auction mechanics",
  fullDescription: `The Dutchman ensures that all participants in a project's raise get the same execution price. No more worrying about being early or late! Just a seamless, equitable investment experience.

Our platform leverages the Dutch Auction mechanism to create a fair and transparent token sale process. This approach eliminates the common pitfalls of traditional fundraising methods in the crypto space, such as front-running, gas wars, and unfair token distribution.`
};

const exampleProject = {
  name: "NexusNet",
  symbol: "NXN",
  description: "Revolutionizing decentralized infrastructure with AI-driven node optimization",
  fullDescription: `NexusNet is a cutting-edge blockchain infrastructure project that leverages artificial intelligence to optimize node performance and network efficiency. By utilizing The Dutchman's fair token distribution mechanism, NexusNet aims to create a decentralized and equitable ecosystem for its participants.`,
  tokenomics: {
    totalSupply: "100,000,000 NXN",
    tokenAllocation: [
      { category: "Public Sale", percentage: "30%", amount: "30,000,000 NXN" },
      { category: "Team and Advisors", percentage: "20%", amount: "20,000,000 NXN", vesting: "2-year vesting, 6-month cliff" },
      { category: "Ecosystem Development", percentage: "25%", amount: "25,000,000 NXN" },
      { category: "Treasury", percentage: "15%", amount: "15,000,000 NXN" },
      { category: "Liquidity Provision", percentage: "10%", amount: "10,000,000 NXN" }
    ],
    initialMarketCap: "$3,000,000 (at $0.10 per token)"
  },
  saleDetails: {
    totalRaise: "$3,000,000",
    tokenPrice: {
      initial: "$0.15",
      final: "$0.10"
    },
    saleFormat: "Dutch Auction",
    acceptedCurrencies: ["ETH", "USDC"],
    vestingSchedule: "25% at TGE, then 25% quarterly",
    softCap: "$1,500,000",
    hardCap: "$3,000,000",
    startDate: "2023-06-15T00:00:00Z",
    endDate: "2023-06-17T00:00:00Z"
  },
  projectMilestones: [
    { quarter: "Q3 2023", milestone: "Mainnet Launch" },
    { quarter: "Q4 2023", milestone: "AI Optimization Engine Integration" },
    { quarter: "Q1 2024", milestone: "Cross-Chain Interoperability" },
    { quarter: "Q2 2024", milestone: "Decentralized Governance Implementation" }
  ],
  team: [
    { name: "Alice Johnson", role: "CEO & Founder", linkedin: "https://linkedin.com/in/alice-johnson" },
    { name: "Bob Smith", role: "CTO", linkedin: "https://linkedin.com/in/bob-smith" },
    { name: "Charlie Davis", role: "Head of Blockchain", linkedin: "https://linkedin.com/in/charlie-davis" }
  ],
  socialLinks: {
    website: "https://nexusnet.io",
    twitter: "https://twitter.com/NexusNet",
    telegram: "https://t.me/NexusNetOfficial",
    github: "https://github.com/NexusNet"
  }
};

const DutchAuctionDemo = () => {
  const [currentPrice, setCurrentPrice] = useState(100);
  const [totalRaised, setTotalRaised] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState('waiting');
  const [bids, setBids] = useState([]);
  const [priceHistory, setPriceHistory] = useState([{ time: 0, price: 100 }]);
  const [finalAllocations, setFinalAllocations] = useState([]);
  const [participants, setParticipants] = useState(initialParticipants);
  const [bidInputs, setBidInputs] = useState({});
  const [showRules, setShowRules] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  const projectGoal = 20000;
  const totalTokens = 1000;
  const minPrice = 50;
  const priceDropInterval = 5000;
  const priceDropAmount = 5;

  useEffect(() => {
    let timer;
    if (auctionStatus === 'running') {
      timer = setTimeout(() => {
        if (currentPrice > minPrice && totalRaised < projectGoal) {
          setCurrentPrice(prev => Math.max(prev - priceDropAmount, minPrice));
          setPriceHistory(prev => [...prev, { time: prev.length, price: Math.max(currentPrice - priceDropAmount, minPrice) }]);
        } else {
          finalizeAuction();
        }
      }, priceDropInterval);
    }
    return () => clearTimeout(timer);
  }, [currentPrice, auctionStatus, totalRaised]);

  useEffect(() => {
    // Initialize Web3Modal
    const initWeb3 = async () => {
      const providerOptions = {
        // Add various wallet providers here
      };

      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
        providerOptions
      });

      const provider = await web3Modal.connect();
      const web3Instance = new Web3(provider);
      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      const chainId = await web3Instance.eth.getChainId();
      setChainId(chainId);
    };

    initWeb3();
  }, []);

  const startAuction = () => setAuctionStatus('running');

  const placeBid = (participant, tokens) => {
    if (tokens > 0 && participant.budget >= tokens * currentPrice) {
      const bidValue = tokens * currentPrice;
      setBids(prev => [...prev, { participant: participant.name, tokens, price: currentPrice }]);
      setTotalRaised(prev => prev + bidValue);
      setParticipants(prev => 
        prev.map(p => p.name === participant.name ? {...p, budget: p.budget - bidValue} : p)
      );
    }
  };

  const handleBidInputChange = (participantName, value) => {
    setBidInputs(prev => ({ ...prev, [participantName]: value }));
  };

  const handlePlaceBid = (participant) => {
    const tokens = parseInt(bidInputs[participant.name] || 0);
    placeBid(participant, tokens);
    setBidInputs(prev => ({ ...prev, [participant.name]: '' }));
  };

  const finalizeAuction = () => {
    setAuctionStatus('completed');
    const totalTokensBid = bids.reduce((sum, bid) => sum + bid.tokens, 0);
    const allocationRatio = Math.min(1, totalTokens / totalTokensBid);

    const allocations = participants.map(participant => {
      const participantBids = bids.filter(bid => bid.participant === participant.name);
      const tokensRequested = participantBids.reduce((sum, bid) => sum + bid.tokens, 0);
      const tokensAllocated = Math.floor(tokensRequested * allocationRatio);
      const totalCost = tokensAllocated * currentPrice;
      return {
        participant: participant.name,
        tokensAllocated,
        pricePaid: currentPrice,
        totalCost
      };
    }).filter(allocation => allocation.tokensAllocated > 0);

    setFinalAllocations(allocations);
  };

  const toggleRules = () => setShowRules(!showRules);
  const toggleProjectDetails = () => setShowProjectDetails(!showProjectDetails);

  const auctionRules = [
    "The auction starts at a high price and decreases over time.",
    "Participants can place bids at any time during the auction.",
    "All successful bidders pay the same final price, regardless of when they bid.",
    "The auction ends when the funding goal is reached or the minimum price is hit.",
    "If oversubscribed, token allocations are distributed proportionally."
  ];

  const auctionBenefits = [
    "Fair pricing for all participants",
    "Reduced FOMO and gas wars common in other sale mechanisms",
    "Efficient price discovery",
    "Transparent and equitable token distribution"
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{dutchmanOverview.name}</h1>
        <p className={styles.description}>{dutchmanOverview.description}</p>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={toggleRules}>
            {showRules ? 'Hide Rules' : 'How It Works'}
          </button>
          <button className={styles.button} onClick={toggleProjectDetails}>
            {showProjectDetails ? 'Hide Example' : 'See Example Project'}
          </button>
        </div>
        <div className={styles.web3Status}>
          {account ? (
            <>
              <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
              <span>Chain ID: {chainId}</span>
            </>
          ) : (
            <button className={styles.connectButton} onClick={() => console.log("Connect Wallet")}>Connect Wallet</button>
          )}
        </div>
        <nav className={styles.navigation}>
          <a href="#how-it-works">How It Works</a>
          <a href="#active-auctions">Active Auctions</a>
          <a href="#your-participation">Your Participation</a>
        </nav>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>About The Dutchman</h2>
        <p>{dutchmanOverview.fullDescription}</p>
      </div>

      {showRules && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>How It Works</h2>
          <div className={styles.rulesGrid}>
            <div>
              <h3>Auction Rules</h3>
              <ul>
                {auctionRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Benefits</h3>
              <ul>
                {auctionBenefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showProjectDetails && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Featured Project: {exampleProject.name} ({exampleProject.symbol})</h2>
          <p>{exampleProject.fullDescription}</p>

          <h3>Tokenomics</h3>
          <ul>
            <li>Total Supply: {exampleProject.tokenomics.totalSupply}</li>
            <li>Initial Market Cap: {exampleProject.tokenomics.initialMarketCap}</li>
          </ul>
          <h4>Token Allocation</h4>
          <ul>
            {exampleProject.tokenomics.tokenAllocation.map((item, index) => (
              <li key={index}>{item.category}: {item.percentage} ({item.amount}){item.vesting ? ` - ${item.vesting}` : ''}</li>
            ))}
          </ul>

          <h3>Sale Details</h3>
          <ul>
            <li>Total Raise: {exampleProject.saleDetails.totalRaise}</li>
            <li>Token Price: {exampleProject.saleDetails.tokenPrice.initial} (initial) - {exampleProject.saleDetails.tokenPrice.final} (final)</li>
            <li>Sale Format: {exampleProject.saleDetails.saleFormat}</li>
            <li>Accepted Currencies: {exampleProject.saleDetails.acceptedCurrencies.join(', ')}</li>
            <li>Vesting Schedule: {exampleProject.saleDetails.vestingSchedule}</li>
            <li>Soft Cap: {exampleProject.saleDetails.softCap}</li>
            <li>Hard Cap: {exampleProject.saleDetails.hardCap}</li>
            <li>Start Date: {new Date(exampleProject.saleDetails.startDate).toLocaleString()}</li>
            <li>End Date: {new Date(exampleProject.saleDetails.endDate).toLocaleString()}</li>
          </ul>

          <h3>Project Roadmap</h3>
          <ul>
            {exampleProject.projectMilestones.map((milestone, index) => (
              <li key={index}>{milestone.quarter}: {milestone.milestone}</li>
            ))}
          </ul>

          <h3>Team</h3>
          <ul>
            {exampleProject.team.map((member, index) => (
              <li key={index}>{member.name} - {member.role} (<a href={member.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>)</li>
            ))}
          </ul>

          <h3>Social Links</h3>
          <ul>
            {Object.entries(exampleProject.socialLinks).map(([platform, url]) => (
              <li key={platform}><a href={url} target="_blank" rel="noopener noreferrer">{platform}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card} id="active-auctions">
          <h2 className={styles.cardTitle}>Active Auctions</h2>
          <div className={styles.auctionList}>
            {[exampleProject, { name: "DecentraLend", symbol: "DCL" }].map((project, index) => (
              <div key={index} className={styles.auctionItem}>
                <h3>{project.name} ({project.symbol})</h3>
                <p>Ends in: {index === 0 ? '2d 5h 30m' : '5d 12h 45m'}</p>
                <div className={styles.auctionProgress}>
                  <div className={styles.progressBar} style={{width: `${index === 0 ? 60 : 30}%`}}></div>
                </div>
                <p>{index === 0 ? '60%' : '30%'} funded</p>
                <button className={styles.button}>View Auction</button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Auction Demo</h2>
          <p>Project completion</p>
          <progress value={totalRaised} max={projectGoal} style={{width: '100%', height: '8px'}} />
          <p>Current price: <span className={styles.statValue}>${currentPrice.toFixed(2)}</span></p>
          <p>Raised: <span className={styles.statValue}>${totalRaised}</span> / Goal: ${projectGoal}</p>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: 'none'}} />
                <Line type="monotone" dataKey="price" stroke="#ff6b35" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Place a bid</h2>
          {auctionStatus === 'waiting' && (
            <button className={styles.button} onClick={startAuction}>Start Auction</button>
          )}
          {auctionStatus === 'running' && (
            <>
              {participants.map(participant => (
                <div key={participant.name} className={styles.bidSection}>
                  <div className={styles.participantInfo}>
                    <p className={styles.participantName}>{participant.name}</p>
                    <p className={styles.participantBudget}>Budget: ${participant.budget}</p>
                  </div>
                  <div className={styles.bidActions}>
                    <input
                      type="number"
                      value={bidInputs[participant.name] || ''}
                      onChange={(e) => handleBidInputChange(participant.name, e.target.value)}
                      placeholder="Tokens"
                      className={styles.input}
                    />
                    <button className={styles.button} onClick={() => handlePlaceBid(participant)}>Bid</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {auctionStatus === 'running' && account && (
            <div className={styles.web3BidSection}>
              <input
                type="number"
                placeholder="Amount in ETH"
                className={styles.input}
              />
              <button className={styles.button} onClick={() => console.log("Place Web3 bid")}>
                Place Bid
              </button>
            </div>
          )}
          {auctionStatus === 'completed' && (
            <div>
              <h3>Final Allocations:</h3>
              <ul>
                {finalAllocations.map((allocation, index) => (
                  <li key={index}>
                    {allocation.participant}: {allocation.tokensAllocated} tokens 
                    at ${allocation.pricePaid} each (Total: ${allocation.totalCost})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.card} id="your-participation">
        <h2 className={styles.cardTitle}>Your Participation</h2>
        <div className={styles.participationStats}>
          <div className={styles.stat}>
            <h3>Total Invested</h3>
            <p className={styles.statValue}>5.2 ETH</p>
          </div>
          <div className={styles.stat}>
            <h3>Tokens Received</h3>
            <p className={styles.statValue}>1,000 NXN</p>
          </div>
          <div className={styles.stat}>
            <h3>Active Bids</h3>
            <p className={styles.statValue}>2</p>
          </div>
        </div>
        <div className={styles.participationHistory}>
          <h3>Bid History</h3>
          <ul className={styles.bidHistory}>
            <li>NexusNet (NXN): 3.5 ETH - Pending</li>
            <li>DecentraLend (DCL): 1.7 ETH - Confirmed</li>
          </ul>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Bids Placed</h2>
        <ul>
          {bids.map((bid, index) => (
            <li key={index}>
              {bid.participant}: {bid.tokens} tokens at ${bid.price.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.landingPage}>
        <h2>Experience Fair Token Distribution with The Dutchman</h2>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>Equal Opportunity</h3>
            <p>Every participant gets the same price, regardless of when they join</p>
          </div>
          <div className={styles.feature}>
            <h3>Transparent Mechanism</h3>
            <p>Clear rules and real-time price discovery</p>
          </div>
          <div className={styles.feature}>
            <h3>Efficient Fundraising</h3>
            <p>Optimal price finding for both projects and investors</p>
          </div>
          <div className={styles.feature}>
            <h3>Web3 Integration</h3>
            <p>Seamlessly connect your wallet and participate in auctions</p>
          </div>
        </div>
        <div className={styles.ctaSection}>
          <button className={styles.ctaButton}>Launch an Auction</button>
          <button className={styles.ctaButton}>Explore Active Auctions</button>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="#">About</a>
          <a href="#">FAQ</a>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
        <p>&copy; 2023 The Dutchman. All rights reserved.</p>
        <div className={styles.socialLinks}>
          <a href="#" aria-label="Twitter">Twitter</a>
          <a href="#" aria-label="Discord">Discord</a>
          <a href="#" aria-label="GitHub">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default DutchAuctionDemo;