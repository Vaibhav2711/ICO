//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoMinionsToken is ERC20, Ownable {
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant tokenPerNFT = 10* 10**18;
    uint256 public constant maxTotalSupply = 10000 * 10**18;
    ICryptoDevs CryptoDevsNFT;
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Minions Token","CM") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 numOfTokens) public payable{
        //total amount required to buy the tokens
        uint256 _requiredAmount = tokenPrice*numOfTokens;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect");
        //following the erc standards for number of tokens
        uint256 tokensWithDecimals = numOfTokens * 10**18;
        require((totalSupply() + tokensWithDecimals) <= maxTotalSupply,"Exceeds the max total supply avialable");
        _mint(msg.sender,tokensWithDecimals);
    } 

    function claim() public {
        address sender = msg.sender;
        //finding the number of nfts owned by the user
        uint256 balance = CryptoDevsNFT.balaceOf(sender);
        require(balance>0,"You dont own any Cryto Minion NFTs");
        //amount keeps a tracks of NFTs that didn't claimed tokens 
        uint256 amount = 0;
        for(uint256 i =0; i< balance; i++){
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            if(!tokenIdsClaimed[tokenId]){
                amount+=1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        require(amount>0,"You have already claimed all the tokens");
        //mint the number of tokens equal to the number of nfts owned*number of tokens per nfts
        _mint(msg.sender,amount*tokenPerNFT);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent,) = _owner.call{value:amount}("");
        require(sent,"Failed to send Ether");
    }

    receive() external payable{}
    fallback() external payable{}
}