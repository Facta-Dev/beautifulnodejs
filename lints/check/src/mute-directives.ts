// Violations of the silencing-reporting requirements: the directives an agent
// would reach for to mute the architecture rules are themselves findings. The
// bare disable mutes the console line below it; the enable restores rule
// coverage for the rest of the file. (The eslint-comments rules report a mute
// at the line after the directive comment, so the markers sit above the
// directive and the checker attributes them to the muted line.)

// expect:@eslint-community/eslint-comments/no-unlimited-disable,@eslint-community/eslint-comments/require-description
/* eslint-disable */
console.log("muted, but the mute is reported");
/* eslint-enable */