pragma solidity ^0.4.4;
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Jukebox {
    
    mapping(address => uint) balances;
    mapping(address => uint8) counter;

    event LogQueueTrack(address indexed client, uint8 indexed counter, string trackURI);

    function queueTrack(address _client, string _trackURI) public payable {
        balances[_client] += msg.value;
        counter[_client]++;
        LogQueueTrack(_client, counter[_client], _trackURI);
    }

    function withdraw() {
        msg.sender.transfer(balances[msg.sender]);
    }

    function getCounter(address _client) view returns(uint8) {
        return counter[_client];
    }
}