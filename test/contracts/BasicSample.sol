// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

abstract contract AbstractBasic {
    function overriddenFunction() internal pure virtual returns (uint256 _returned);
}

contract BasicSample is AbstractBasic {
    /**
     * @notice Some notice of the struct
     */
    struct TestStruct {
        address someAddress;
        uint256 someNumber;
    }

    /**
     * @notice Some error missing parameter natspec
     */
    error BasicSample_SomeError(uint256 _param1);

    /**
     * @notice An event missing parameter natspec
     */
    event BasicSample_BasicEvent(uint256 _param1);

    /**
     * @notice Empty string for revert checks
     * @dev result of doing keccak256(bytes(''))
     */
    bytes32 internal constant _EMPTY_STRING = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

    /**
     * @notice A public state variable
     */
    uint256 public somePublicNumber;

    constructor(bool _randomFlag) {}

    /**
     * @notice External function that returns a bool
     * @dev A dev comment
     * @param  _magicNumber A parameter description
     * @param _name Another parameter description
     * @param _name Another parameter description
     * @return _isMagic Some return data
     */
    function externalSimple(uint256 _magicNumber, string memory _name) external pure returns (bool _isMagic) {
        return true;
    }

    /**
    * @notice External function that returns a bool
    */
    function externalNoReturn() external pure returns (bool) {
        return true;
    }

    /**
     * @notice Private test function
     * @param _magicNumber A parameter description
     */
    function privateSimple(uint256 _magicNumber) private pure {}

    /**
     * @notice Private test function
     *         with multiple
     * lines
     */
    function multiline() external pure {}

    /**
     * @notice Private test function
     * @notice Another notice
     */
    function multitag() external pure {}

    /**
     * @notice External function that returns a bool
     * @dev A dev comment
     * @param _magicNumber A parameter description
     * @param    _name Another parameter description
     * @return _isMagic Some return data
     * @return Test test
     */
    function externalSimpleMultipleReturn(uint256 _magicNumber, string memory _name)
        external
        pure
        returns (bool _isMagic, uint256)
    {
        return (true, 111);
    }

    /**
     * @notice External function that returns a bool
     * @dev A dev comment
     * @return Some return data
     */
    function externalSimpleMultipleUnnamedReturn() external pure returns (bool, uint256) {
        return (true, 111);
    }

    /**
     * @notice This function should have an inheritdoc tag
     */
    function overriddenFunction() internal pure override returns (uint256 _returned) {
        return 1;
    }

    function virtualFunction() public pure virtual returns (uint256 _returned) {}

    /**
     * @notice Modifier notice
     */
    modifier transferFee(uint256 _receiver) {
        _;
    }

    /**
     * @dev This func must be ignored
     */
    receive() external payable {}

    /**
     * @dev This func must be ignored
     */
    fallback() external {}
}
