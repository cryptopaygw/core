import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying test tokens to Hardhat network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get the contract factory
  const TestToken = await ethers.getContractFactory("TestToken");
  
  // Deploy test tokens with different configurations
  const tokens = [
    {
      name: "Test USDC",
      symbol: "TUSDC", 
      decimals: 6,
      initialSupply: 1000000, // 1M USDC
    },
    {
      name: "Test DAI",
      symbol: "TDAI",
      decimals: 18,
      initialSupply: 1000000, // 1M DAI
    },
    {
      name: "Test WETH",
      symbol: "TWETH",
      decimals: 18,
      initialSupply: 10000, // 10K WETH
    },
    {
      name: "Test USDT",
      symbol: "TUSDT",
      decimals: 6,
      initialSupply: 1000000, // 1M USDT
    }
  ];

  const deployedTokens = [];

  for (const tokenConfig of tokens) {
    console.log(`\n📝 Deploying ${tokenConfig.name} (${tokenConfig.symbol})...`);
    
    const token = await TestToken.deploy(
      tokenConfig.name,
      tokenConfig.symbol,
      tokenConfig.decimals,
      tokenConfig.initialSupply
    );
    
    await token.waitForDeployment();
    
    const tokenAddress = await token.getAddress();
    console.log(`✅ ${tokenConfig.symbol} deployed to:`, tokenAddress);
    
    // Verify token properties
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);
    
    deployedTokens.push({
      name: tokenConfig.name,
      symbol: tokenConfig.symbol,
      address: tokenAddress,
      decimals: Number(decimals),
      contract: token
    });
  }
  
  console.log("\n🎯 All tokens deployed successfully!");
  console.log("\n📋 Deployment Summary:");
  deployedTokens.forEach(token => {
    console.log(`${token.symbol}: ${token.address}`);
  });
  
  // Fund some test accounts with tokens
  console.log("\n💰 Funding test accounts...");
  const accounts = await ethers.getSigners();
  const testAccounts = accounts.slice(1, 6); // Use accounts 1-5 for testing
  
  for (const token of deployedTokens) {
    console.log(`\n🔄 Funding accounts with ${token.symbol}...`);
    
    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      const amount = ethers.parseUnits("1000", token.decimals); // 1000 tokens each
      
      await token.contract.mint(account.address, amount);
      console.log(`   ✅ Sent 1000 ${token.symbol} to ${account.address}`);
    }
  }
  
  // Save deployment information
  const deploymentInfo = {
    network: "hardhat",
    chainId: 31337,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    tokens: deployedTokens.map(token => ({
      name: token.name,
      symbol: token.symbol,
      address: token.address,
      decimals: token.decimals
    }))
  };
  
  console.log("\n📄 Deployment info saved to deployments.json");
  
  // Write to a simple file that tests can read
  fs.writeFileSync('./deployments.json', JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n✨ Setup complete! Ready for integration testing.");
  
  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((info) => {
    console.log("\n🎉 Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
