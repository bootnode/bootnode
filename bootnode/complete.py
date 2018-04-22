import sys


def complete(argv, parser):
    """Return completions for commandline."""
    if not argv[1:]:
        return

    if not argv[1] == 'complete':
        return

    # Generate list of command:descriptions
    completions = []
    commands = parser.format_help().split('\n')[8:-5]
    for cmd in commands:
        k, v = cmd.strip().split(None, 1)
        completions.append("{0}:{1}".format(k, v))

    print('\n'.join(completions))
    sys.exit(0)
