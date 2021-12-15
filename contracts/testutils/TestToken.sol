// SPDX-License-Identifier: MIT

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interface/ERC20Permit.sol";

/**
 * @title Test Token
 * @dev Test ERC20 Token
 */
contract TestToken is ERC20Permit, Ownable {
    uint256 public constant MAX_CAP = 1_000_000_000 * (10**18); // 1.0 billion tokens
    address public governance;

    event GovernanceChanged(
        address indexed previousGovernance,
        address indexed newGovernance
    );

    modifier onlyGovernance() {
        require(msg.sender == governance, "!governance");
        _;
    }

    constructor() ERC20("Test", "Test") {
        governance = msg.sender;
        _mint(governance, MAX_CAP);
    }

    /**
     * @notice Function to set governance contract
     * Owner is assumed to be governance
     * @param _governance Address of governance contract
     */
    function setGovernance(address _governance) external onlyGovernance {
        require(_governance != address(0), "Invalid address");
        governance = _governance;
        emit GovernanceChanged(msg.sender, _governance);
    }
}
