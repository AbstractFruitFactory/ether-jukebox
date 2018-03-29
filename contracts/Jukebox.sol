pragma solidity ^0.4.4;

contract Jukebox {
    
    event nextQueuedTrack(string spotifyClientID, string trackURI);

    function queueTrack(string _spotifyClientID, string _trackURI) public payable {
        nextQueuedTrack(_spotifyClientID, _trackURI);
    }
}