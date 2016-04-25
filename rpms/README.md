# RPM package build instructions
* Download the same version of pgp-zimlet source file from GitHub into ~/rpmbuild/SOURCES/<version>.tar.gz
* Run "rpmbuild -bb pgp-zimlet.spec" for building RPM package
* By default, the newly created RPM package would be written to ~/rpmbuild/RPMS/noarch/pgp-zimlet-...rpm

# Installation
* Install: "rpm -Uvh <path-to-rpm-file>"
* Uninstall: "rpm -e pgp-zimlet"

# References:
* See https://fedoraproject.org/wiki/How_to_create_an_RPM_package for more infomrarion.
