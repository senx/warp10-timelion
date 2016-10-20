# The WarpScript command

In order to correctly works, the Warp10 backend end to reach *needs a WarpScript macro* to convert series to timelion format.

## Config 

Add in timelion properties (src/core_plugins/timelion/timelion.json) the Warp 10 URL backend:

```
  "warpscript": {
    "url": "http://localhost:8080/api/v0/exec",
    "header": "warp10"
  },
```

Header corresponds to the pattern to match in error return (by default it's warp10). If using an old Warp 10 backend, it might be cityzendata.

Add the warpscript.js in (src/core_plugins/timelion/server/series_function) folder.

## Simple use

To use warpscript use the following command: 

```
.warpscript(code="YOUR WARPSCRIPT HERE")
```

Then the FIRST element on the stack will be converted to TIMELION format. It expects to found a single GeoTime serie or a list of GTS.

## Position parameter 

To choose to print an element that is a different position on the WarpScript stack use the attribute position: 

```
.warpscript(code="YOUR WARPSCRIPT HERE",position=1)
```

This command will also load the first element on the stack then will converts it to TIMELION format.


## Fit parameter

Algorithm to use for fitting series to the target time span and interval. Available: average, carry, nearest, none, scale.

```
.warpscript(code="YOUR WARPSCRIPT HERE",fit="none")
```

## DataFormat parameter

Add some custom series attributes to each series to plot. The api can be found on github: https://github.com/elastic/timelion/blob/master/bower_components/flot/API.md. The attributes that can added belongs to the Data Format category.

```
.warpscript(code="YOUR WARPSCRIPT HERE",dataFormat='{"shadowSize": 8}')
```

## Time interval

The time interval parameter configured with timelion is push as a number variable in WarpScript (converted in base unit Time of the Warp10 platform reached).

To reuse it just load it from the variable *intervalTime* somewhere in your WarpScript code: 

```
$intervalTime
```