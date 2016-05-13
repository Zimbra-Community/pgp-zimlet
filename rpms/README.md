# RPM package build instructions
* Download the same version of pgp-zimlet source file from GitHub into ~/rpmbuild/SOURCES/<version>.tar.gz
* Run "rpmbuild -bb pgp-zimlet.spec" for building RPM package
* By default, the newly created RPM package would be written to ~/rpmbuild/RPMS/noarch/pgp-zimlet-...rpm

# Prebuilt packages
* We are working out to make an official repository for all RPM packages. In this meantime, please use Copr at: https://copr.fedorainfracloud.org/coprs/tuanta/zimlets/

# Installing RPM packages
* Install: "rpm -Uvh <path-to-rpm-file>"
* Uninstall: "rpm -e pgp-zimlet"

# Installing from Copr repository using YUM
* Enable Copr repo: download this file and save into /etc/yum.repos.d:
  * For EL6: https://copr.fedorainfracloud.org/coprs/tuanta/zimlets/repo/epel-6/tuanta-zimlets-epel-6.repo
  * For EL7: https://copr.fedorainfracloud.org/coprs/tuanta/zimlets/repo/epel-7/tuanta-zimlets-epel-7.repo
* Install using YUM: "yum install pgp-zimlet"
* Update new releases: "yum update pgp-zimlet"
* And uninstall: "yum remove pgp-zimlet"

# References:
* See https://fedoraproject.org/wiki/How_to_create_an_RPM_package for more information.
