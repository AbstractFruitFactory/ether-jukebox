pragma solidity ^0.4.4;

contract Jukebox {

    uint minPayment = 0.1 ether;

    event hasPayed(bytes trackURI);
    
    function() payable {
        require(msg.value >= minPayment);
        hasPayed(msg.data);
    }
}