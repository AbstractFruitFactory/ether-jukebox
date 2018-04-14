pragma solidity ^0.4.4;

contract Jukebox {
    
    event NextQueuedTrack(string indexed userID, string trackURI);

    function queueTrack(string _userID, string _trackURI) public payable {
        NextQueuedTrack(_userID, _trackURI);
    }
}