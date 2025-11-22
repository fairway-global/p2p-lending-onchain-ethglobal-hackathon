import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SimpleSavingPlan", (m) => {
  // Deploy SimpleSavingPlan contract
  // The constructor takes no parameters (uses Ownable with msg.sender as owner)
  const simpleSavingPlan = m.contract("SimpleSavingPlan", []);

  return { simpleSavingPlan };
});

