//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

interface ICryptoDevs {

    function tokenOfOwnerByIndex(address Owner, uint256 index) external view returns(uint256 tokenId);

    function balaceOf(address Owner) external view returns(uint256 balance);
}